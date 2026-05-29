import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requiresAdminApproval, shouldSkipEmailVerification } from "@/lib/app-url";
import type { GoogleProfile } from "@/lib/google-auth";
import type { User } from "@prisma/client";

function sanitizeUsernameBase(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return base.length >= 3 ? base.slice(0, 16) : "user";
}

async function generateUniqueUsername(email: string, name: string): Promise<string> {
  const fromEmail = sanitizeUsernameBase(email.split("@")[0] || "user");
  const fromName = sanitizeUsernameBase(name.replace(/\s+/g, "_"));
  const candidates = [fromEmail, fromName, `${fromEmail}_${crypto.randomBytes(2).toString("hex")}`];

  for (const candidate of candidates) {
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }

  return `${fromEmail}_${crypto.randomBytes(3).toString("hex")}`;
}

async function resolveNewUserStatus(inviteCode?: string) {
  let status: "ACTIVE" | "PENDING_APPROVAL" = requiresAdminApproval() ? "PENDING_APPROVAL" : "ACTIVE";
  let verifiedInvite: { id: string } | null = null;

  if (inviteCode) {
    verifiedInvite = await prisma.invite.findFirst({
      where: {
        code: inviteCode,
        status: "UNUSED",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (!verifiedInvite) {
      throw new Error("Invalid or expired invite code");
    }
    status = "ACTIVE";
  } else {
    const userCount = await prisma.user.count();
    if (userCount === 0) status = "ACTIVE";
  }

  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  return { status, verifiedInvite, isFirstUser };
}

export async function findOrCreateGoogleUser(
  profile: GoogleProfile,
  inviteCode?: string
): Promise<User> {
  const email = profile.email.toLowerCase();
  const skipEmailVerification = shouldSkipEmailVerification();

  const byGoogle = await prisma.user.findUnique({ where: { googleId: profile.id } });
  if (byGoogle) return byGoogle;

  const byEmail = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.id) {
      throw new Error("This email is linked to a different Google account");
    }
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: profile.id,
        emailVerified: true,
        ...(profile.picture
          ? {
              profile: {
                upsert: {
                  create: {
                    displayName: profile.name,
                    avatarUrl: profile.picture,
                    privacySetting: "PUBLIC",
                  },
                  update: {
                    avatarUrl: profile.picture,
                    displayName: profile.name,
                  },
                },
              },
            }
          : {}),
      },
    });
  }

  const { status, verifiedInvite, isFirstUser } = await resolveNewUserStatus(inviteCode);
  const username = await generateUniqueUsername(email, profile.name);
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        googleId: profile.id,
        role: isFirstUser ? "ADMIN" : "USER",
        status: isFirstUser ? "ACTIVE" : status,
        emailVerified: skipEmailVerification || Boolean(profile.verified_email),
        profile: {
          create: {
            displayName: profile.name || username,
            avatarUrl: profile.picture ?? null,
            bio: "Hello! I am a new member of this private network.",
            privacySetting: "PUBLIC",
          },
        },
      },
    });

    if (verifiedInvite) {
      await tx.invite.update({
        where: { id: verifiedInvite.id },
        data: {
          usedById: user.id,
          status: "USED",
          useCount: { increment: 1 },
        },
      });
    }

    return user;
  });
}

export function getGoogleAuthErrorRedirect(error: string, returnTo: "login" | "signup" = "login"): string {
  const path = returnTo === "signup" ? "/signup" : "/login";
  return `${path}?error=${encodeURIComponent(error)}`;
}
