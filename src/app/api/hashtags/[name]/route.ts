import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await params;
    const tagName = decodeURIComponent(name).toLowerCase().replace(/^#/, "");

    const hashtag = await prisma.hashtag.findUnique({
      where: { name: tagName },
      include: {
        posts: {
          take: 30,
          orderBy: { post: { createdAt: "desc" } },
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
        },
        _count: { select: { posts: true } },
      },
    });

    if (!hashtag) {
      return NextResponse.json({ hashtag: tagName, postCount: 0, posts: [] });
    }

    const posts = hashtag.posts
      .map((ph) => ph.post)
      .filter((p) => !p.deletedAt && p.visibility === "PUBLIC");

    return NextResponse.json({
      hashtag: hashtag.name,
      postCount: hashtag._count.posts,
      posts: posts.map((p) => ({
        ...p,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        sharesCount: p._count.shares,
        isLiked: false,
        isBookmarked: false,
      })),
    });
  } catch (error) {
    console.error("Hashtag posts error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
