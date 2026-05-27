import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { sendEmail, getEmailVerificationTemplate } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid inputs", details: result.error.flatten().fieldErrors },
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
    let statusToAssign = "PENDING_APPROVAL"; // default private community flow
    let verifiedInvite: any = null;

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
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: isFirstUser ? "ADMIN" : "USER",
          status: isFirstUser ? "ACTIVE" : (statusToAssign as any),
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

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${emailVerifyToken}`;
    await sendEmail({
      to: email,
      subject: "Verify your email address",
      html: getEmailVerificationTemplate(username, verificationUrl),
    });

    return NextResponse.json(
      {
        message: isFirstUser
          ? "Admin user created successfully! Verification email sent."
          : inviteCode
          ? "Account registered successfully! Please check your email to verify."
          : "Account registered successfully! Awaiting administrator approval. Please check your email to verify.",
        status: newUser.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
