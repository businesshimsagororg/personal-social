import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  isGoogleOAuthConfigured,
} from "@/lib/google-auth";

const OAUTH_COOKIE = "google_oauth";
const COOKIE_MAX_AGE = 600; // 10 minutes

export async function GET(req: NextRequest) {
  const returnToParam = new URL(req.url).searchParams.get("returnTo");
  const returnTo = returnToParam === "signup" ? "signup" : "login";

  if (!isGoogleOAuthConfigured()) {
    const { getGoogleAuthErrorRedirect } = await import("@/lib/google-user");
    const { getAppUrl } = await import("@/lib/app-url");
    return NextResponse.redirect(
      new URL(
        getGoogleAuthErrorRedirect("Google sign-in is not configured on this server", returnTo),
        getAppUrl()
      )
    );
  }

  const { searchParams } = new URL(req.url);
  const inviteCode = searchParams.get("invite")?.trim() || undefined;

  const state = createOAuthState();
  const cookieStore = await cookies();
  cookieStore.set(
    OAUTH_COOKIE,
    JSON.stringify({ state, inviteCode, returnTo }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    }
  );

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
