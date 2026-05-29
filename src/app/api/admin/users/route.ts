import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";
import type { UserStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "PENDING_APPROVAL") as UserStatus;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 50);

  const users = await prisma.user.findMany({
    where: { status },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  });

  let nextCursor: string | undefined;
  if (users.length > limit) {
    const next = users.pop();
    nextCursor = next?.id;
  }

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      profile: u.profile,
    })),
    nextCursor,
  });
}
