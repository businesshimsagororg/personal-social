import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle/Create like
    const existingLike = await prisma.like.findFirst({
      where: { userId: user.id, postId },
    });

    if (existingLike) {
      return NextResponse.json({ message: "Post already liked" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId: user.id,
          postId,
        },
      });

      // Create notification for post author if the user who liked is not the post author
      if (post.authorId !== user.id) {
        await tx.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: user.id,
            type: "LIKE_POST",
            targetId: postId,
          },
        });
      }
    });

    return NextResponse.json({ message: "Post liked successfully" });
  } catch (error) {
    console.error("Like post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingLike = await prisma.like.findFirst({
      where: { userId: user.id, postId },
    });

    if (!existingLike) {
      return NextResponse.json({ message: "Post not liked yet" }, { status: 400 });
    }

    await prisma.like.delete({
      where: { id: existingLike.id },
    });

    return NextResponse.json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error("Unlike post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
