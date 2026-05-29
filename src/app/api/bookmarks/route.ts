import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                role: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
            media: true,
            _count: { select: { likes: true, comments: true, shares: true } },
          },
        },
      },
    });

    const posts = bookmarks
      .filter((b) => b.post && !b.post.deletedAt)
      .map((b) => ({
        ...b.post,
        isLiked: false,
        isBookmarked: true,
        likesCount: b.post._count.likes,
        commentsCount: b.post._count.comments,
        sharesCount: b.post._count.shares,
      }));

    const liked = await prisma.like.findMany({
      where: { userId: user.id, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const likedSet = new Set(liked.map((l) => l.postId));

    return NextResponse.json({
      posts: posts.map((p) => ({ ...p, isLiked: likedSet.has(p.id) })),
    });
  } catch (error) {
    console.error("List bookmarks error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
