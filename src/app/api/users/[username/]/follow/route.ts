import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === targetUser.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if target blocked user or user blocked target
    const blockRecord = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: targetUser.id },
          { blockerId: targetUser.id, blockedId: user.id },
        ],
      },
    });

    if (blockRecord) {
      return NextResponse.json({ error: "You cannot follow this user" }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ message: "Already following or requested" }, { status: 400 });
    }

    // Determine pending status based on target profile privacy
    const isPending = targetUser.profile?.privacySetting !== "PUBLIC";

    const follow = await prisma.$transaction(async (tx) => {
      const f = await tx.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUser.id,
          isPending,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          recipientId: targetUser.id,
          actorId: user.id,
          type: isPending ? "FOLLOW_REQUEST" : "FOLLOW_ACCEPT",
          targetId: user.id,
        },
      });

      return f;
    });

    return NextResponse.json({
      message: isPending ? "Follow request sent" : "Followed successfully",
      isPending,
    });
  } catch (error) {
    console.error("Follow user error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json({ error: "Not following this user" }, { status: 400 });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
