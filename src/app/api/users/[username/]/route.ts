import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user and profile details
    const targetUser = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check relationship state (is requester following target? is it pending?)
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
    });

    // Check if target follows requester (for Mutuals check)
    const followedBackRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUser.id,
          followingId: user.id,
        },
      },
    });

    // Count metrics
    const postsCount = await prisma.post.count({
      where: { authorId: targetUser.id, deletedAt: null },
    });

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUser.id, isPending: false },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: targetUser.id, isPending: false },
    });

    // Verify if requester has permission to view posts
    // Permitted if:
    // 1. Target is self
    // 2. Profile setting is PUBLIC
    // 3. Profile setting is FOLLOWERS and followRecord exists and isAccepted (isPending = false)
    const isSelf = user.id === targetUser.id;
    const isAcceptedFollower = followRecord ? !followRecord.isPending : false;
    const isMutual = isAcceptedFollower && (followedBackRecord ? !followedBackRecord.isPending : false);

    let canViewContent = false;
    if (isSelf || targetUser.profile?.privacySetting === "PUBLIC") {
      canViewContent = true;
    } else if (targetUser.profile?.privacySetting === "FOLLOWERS" && isAcceptedFollower) {
      canViewContent = true;
    }

    return NextResponse.json({
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        createdAt: targetUser.createdAt,
        profile: targetUser.profile,
      },
      stats: {
        postsCount,
        followersCount,
        followingCount,
      },
      relationship: {
        isSelf,
        isFollowing: !!followRecord,
        isPending: followRecord ? followRecord.isPending : false,
        isMutual,
        canViewContent,
      },
    });
  } catch (error) {
    console.error("Fetch profile stats error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
