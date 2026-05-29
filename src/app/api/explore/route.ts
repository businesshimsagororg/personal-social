import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [trendingHashtags, suggestedUsers, recentPosts] = await Promise.all([
      prisma.hashtag.findMany({
        take: 12,
        orderBy: { posts: { _count: "desc" } },
        include: { _count: { select: { posts: true } } },
      }),
      prisma.user.findMany({
        where: { id: { not: user.id }, status: "ACTIVE" },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatarUrl: true, bio: true } },
          _count: { select: { followers: true, posts: true } },
        },
      }),
      prisma.post.findMany({
        where: { deletedAt: null, visibility: "PUBLIC" },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          tags: { include: { hashtag: true } },
        },
      }),
    ]);

    return NextResponse.json({
      hashtags: trendingHashtags.map((h) => ({
        name: h.name,
        postCount: h._count.posts,
      })),
      suggestedUsers: suggestedUsers.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.profile?.displayName,
        avatarUrl: u.profile?.avatarUrl,
        bio: u.profile?.bio,
        followersCount: u._count.followers,
        postsCount: u._count.posts,
      })),
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        content: p.content.slice(0, 200),
        authorUsername: p.author.username,
        hashtags: p.tags.map((t) => t.hashtag.name),
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Explore error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
