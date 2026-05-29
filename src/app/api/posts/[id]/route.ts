import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { postCreateSchema } from "@/lib/validations";
import { sanitizeText } from "@/lib/sanitize";
import { notifyMentions, syncPostHashtags } from "@/lib/post-content";
import { canViewerAccessPost } from "@/lib/post-access";

const patchSchema = postCreateSchema.pick({ content: true, visibility: true }).partial();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const content = result.data.content !== undefined ? sanitizeText(result.data.content) : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.post.update({
        where: { id },
        data: {
          ...(content !== undefined ? { content } : {}),
          ...(result.data.visibility ? { visibility: result.data.visibility } : {}),
        },
      });
      if (content !== undefined) {
        await syncPostHashtags(id, content, tx);
      }
      return p;
    });

    if (content !== undefined) {
      await notifyMentions(content, user.id, id);
    }

    return NextResponse.json({ message: "Post updated", post: updated });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
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
        tags: { include: { hashtag: true } },
        _count: { select: { likes: true, comments: true, shares: true } },
      },
    });

    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (!(await canViewerAccessPost(user.id, post))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [liked, bookmarked, shared] = await Promise.all([
      prisma.like.findFirst({ where: { userId: user.id, postId: id } }),
      prisma.bookmark.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } }),
      prisma.share.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } }),
    ]);

    return NextResponse.json({
      post: {
        ...post,
        hashtags: post.tags.map((t) => t.hashtag.name),
        isLiked: Boolean(liked),
        isBookmarked: Boolean(bookmarked),
        isShared: Boolean(shared),
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        sharesCount: post._count.shares,
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
