import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForProfile, isGoogleOAuthConfigured } from "@/lib/google-auth";
import { findOrCreateGoogleUser, getGoogleAuthErrorRedirect } from "@/lib/google-user";
import { loginUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldSkipEmailVerification } from "@/lib/app-url";
import { getAppUrl } from "@/lib/app-url";

const OAUTH_COOKIE = "google_oauth";

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(OAUTH_COOKIE)?.value;
  cookieStore.delete(OAUTH_COOKIE);

  let returnTo: "login" | "signup" = "login";
  let inviteCode: string | undefined;

  if (rawCookie) {
    try {
      const parsed = JSON.parse(rawCookie) as {
        state?: string;
        inviteCode?: string;
        returnTo?: "login" | "signup";
      };
      returnTo = parsed.returnTo === "signup" ? "signup" : "login";
      inviteCode = parsed.inviteCode;

      if (!state || parsed.state !== state) {
        return NextResponse.redirect(
          new URL(getGoogleAuthErrorRedirect("Invalid OAuth state. Please try again.", returnTo), appUrl)
        );
      }
    } catch {
      return NextResponse.redirect(
        new URL(getGoogleAuthErrorRedirect("Invalid OAuth session. Please try again.", returnTo), appUrl)
      );
    }
  }

  if (oauthError) {
    return NextResponse.redirect(
      new URL(getGoogleAuthErrorRedirect("Google sign-in was cancelled", returnTo), appUrl)
    );
  }

  if (!isGoogleOAuthConfigured() || !code) {
    return NextResponse.redirect(
      new URL(getGoogleAuthErrorRedirect("Google sign-in failed", returnTo), appUrl)
    );
  }

  try {
    const profile = await exchangeCodeForProfile(code);
    const user = await findOrCreateGoogleUser(profile, inviteCode);

    if (user.status === "BANNED") {
      return NextResponse.redirect(
        new URL(getGoogleAuthErrorRedirect("Your account has been banned", returnTo), appUrl)
      );
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.redirect(
        new URL(getGoogleAuthErrorRedirect("Your account has been suspended", returnTo), appUrl)
      );
    }
    if (user.status === "PENDING_APPROVAL") {
      return NextResponse.redirect(
        new URL(
          getGoogleAuthErrorRedirect(
            "Your account is awaiting administrator approval",
            returnTo
          ),
          appUrl
        )
      );
    }
    if (!user.emailVerified && !shouldSkipEmailVerification()) {
      return NextResponse.redirect(
        new URL(getGoogleAuthErrorRedirect("Please verify your email before signing in", returnTo), appUrl)
      );
    }

    await loginUserSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN_GOOGLE",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.redirect(new URL("/feed", appUrl));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const message =
      error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
    return NextResponse.redirect(new URL(getGoogleAuthErrorRedirect(message, returnTo), appUrl));
  }
}
