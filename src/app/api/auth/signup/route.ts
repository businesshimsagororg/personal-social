import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { formatValidationErrors, signupSchema } from "@/lib/validations";
import { sendEmail, getEmailVerificationTemplate } from "@/lib/email";
import {
  getAppUrl,
  requiresAdminApproval,
  shouldSkipEmailVerification,
} from "@/lib/app-url";
import {
  getAuthErrorMessage,
  getDatabaseConfigError,
  isPrismaConnectionError,
} from "@/lib/db-errors";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const configError = getDatabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 503 });
    }

    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: formatValidationErrors(fieldErrors), details: fieldErrors },
        { status: 400 }
      );
    }

    const { email, username, password, inviteCode } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // Check invite system settings / invite codes
    let statusToAssign = requiresAdminApproval() ? "PENDING_APPROVAL" : "ACTIVE";
    let verifiedInvite: { id: string } | null = null;

    if (inviteCode) {
      verifiedInvite = await prisma.invite.findFirst({
        where: {
          code: inviteCode,
          status: "UNUSED",
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!verifiedInvite) {
        return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 400 });
      }
      
      statusToAssign = "ACTIVE"; // bypass approval if valid invite code is used
    } else {
      // Check if there are ANY users in the database yet.
      // If NOT, the first user who registers automatically becomes ADMIN and ACTIVE!
      // This is a premium onboarding detail.
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        statusToAssign = "ACTIVE";
      }
    }

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const passwordHash = await hashPassword(password);
    const skipEmailVerification = shouldSkipEmailVerification();
    const emailVerifyToken = skipEmailVerification
      ? null
      : crypto.randomBytes(32).toString("hex");
    const emailVerifyExpires = skipEmailVerification
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: isFirstUser ? "ADMIN" : "USER",
          status: isFirstUser ? "ACTIVE" : (statusToAssign as "ACTIVE" | "PENDING_APPROVAL"),
          emailVerified: skipEmailVerification,
          emailVerifyToken,
          emailVerifyExpires,
          profile: {
            create: {
              displayName: username,
              bio: `Hello! I am a new member of this private network.`,
              privacySetting: "PUBLIC",
            },
          },
        },
      });

      // Update invite code if verified
      if (verifiedInvite) {
        await tx.invite.update({
          where: { id: verifiedInvite.id },
          data: {
            usedById: u.id,
            status: "USED",
            useCount: { increment: 1 }
          }
        });
      }

      return u;
    });

    let verificationUrl: string | undefined;
    if (!skipEmailVerification && emailVerifyToken) {
      verificationUrl = `${getAppUrl()}/verify-email?token=${emailVerifyToken}`;
      await sendEmail({
        to: email,
        subject: "Verify your email address",
        html: getEmailVerificationTemplate(username, verificationUrl),
      });
    }

    const needsApproval =
      newUser.status === "PENDING_APPROVAL" && !isFirstUser && !inviteCode;

    return NextResponse.json(
      {
        message: isFirstUser
          ? skipEmailVerification
            ? "Admin account created. You can sign in now."
            : "Admin account created. Check your email to verify, then sign in."
          : needsApproval
            ? "Account created. Awaiting administrator approval, then verify your email to sign in."
            : skipEmailVerification
              ? "Account created. You can sign in now."
              : "Account created. Check your email to verify, then sign in.",
        status: newUser.status,
        emailVerified: newUser.emailVerified,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    const status =
      isPrismaConnectionError(error) || getDatabaseConfigError() ? 503 : 500;
    return NextResponse.json({ error: getAuthErrorMessage(error) }, { status });
  }
}
