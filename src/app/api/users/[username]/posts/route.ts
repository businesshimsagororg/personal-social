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

    const targetUser = await prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check relationship state
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
    });

    const followedBackRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUser.id,
          followingId: user.id,
        },
      },
    });

    const isSelf = user.id === targetUser.id;
    const isAcceptedFollower = followRecord ? !followRecord.isPending : false;
    const isMutual = isAcceptedFollower && (followedBackRecord ? !followedBackRecord.isPending : false);

    // Profile visibility check
    let canViewContent = false;
    if (isSelf || targetUser.profile?.privacySetting === "PUBLIC") {
      canViewContent = true;
    } else if (targetUser.profile?.privacySetting === "FOLLOWERS" && isAcceptedFollower) {
      canViewContent = true;
    }

    if (!canViewContent) {
      return NextResponse.json({ posts: [], error: "This profile is private." }, { status: 403 });
    }

    // Build post-level visibility filters
    // Requester can view post if:
    // 1. Post is PUBLIC
    // 2. Requester is self
    // 3. Post is FOLLOWERS and requester is accepted follower
    // 4. Post is MUTUALS and requester has mutual follow status
    const posts = await prisma.post.findMany({
      where: {
        authorId: targetUser.id,
        deletedAt: null,
        OR: isSelf
          ? [{ authorId: targetUser.id }]
          : [
              { visibility: "PUBLIC" },
              isAcceptedFollower ? { visibility: "FOLLOWERS" } : {},
              isMutual ? { visibility: "MUTUALS" } : {},
            ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        likes: {
          where: { userId: user.id },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { deletedAt: null } },
            shares: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      visibility: post.visibility,
      createdAt: post.createdAt,
      author: post.author,
      isLiked: post.likes.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post._count.shares,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Fetch user posts error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
