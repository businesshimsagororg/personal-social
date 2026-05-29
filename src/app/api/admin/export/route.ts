import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      profile: {
        select: { displayName: true, bio: true, location: true, privacySetting: true },
      },
      _count: {
        select: { posts: true, followers: true, following: true, messagesSent: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.user!.id,
      action: "ADMIN_EXPORT_USERS",
      metadata: JSON.stringify({ count: users.length }),
    },
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      displayName: u.profile?.displayName,
      bio: u.profile?.bio,
      location: u.profile?.location,
      privacySetting: u.profile?.privacySetting,
      postsCount: u._count.posts,
      followersCount: u._count.followers,
      followingCount: u._count.following,
      messagesSentCount: u._count.messagesSent,
    })),
  });
}
