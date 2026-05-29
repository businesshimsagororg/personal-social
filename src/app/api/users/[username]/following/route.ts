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

    const following = await prisma.follow.findMany({
      where: { followerId: target.id, isPending: false },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({
      users: following.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.profile?.displayName,
        avatarUrl: f.following.profile?.avatarUrl,
      })),
    });
  } catch (error) {
    console.error("Following error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
