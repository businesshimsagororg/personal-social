import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username } = await params;
    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const followers = await prisma.follow.findMany({
      where: { followingId: target.id, isPending: false },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({
      users: followers.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.profile?.displayName,
        avatarUrl: f.follower.profile?.avatarUrl,
      })),
    });
  } catch (error) {
    console.error("Followers error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
