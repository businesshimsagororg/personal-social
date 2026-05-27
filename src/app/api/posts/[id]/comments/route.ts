import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { commentCreateSchema } from "@/lib/validations";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await context.params;
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

    const body = await req.json();
    const result = commentCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid comment", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, parentId } = result.data;

    // Create the comment and notifications in a transaction
    const newComment = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId,
          authorId: user.id,
          content,
          parentId,
        },
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // 1. Notify Post Author (only if commenter is not post author)
      if (post.authorId !== user.id) {
        await tx.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: user.id,
            type: "COMMENT",
            targetId: postId,
          },
        });
      }

      // 2. Notify Parent Comment Author (only if nested reply and not replying to self)
      if (parentId) {
        const parentComment = await tx.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });

        if (parentComment && parentComment.authorId !== user.id && parentComment.authorId !== post.authorId) {
          await tx.notification.create({
            data: {
              recipientId: parentComment.authorId,
              actorId: user.id,
              type: "COMMENT",
              targetId: postId,
            },
          });
        }
      }

      return comment;
    });

    return NextResponse.json({ message: "Comment posted", comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await context.params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch flat list of comments first, then construct hierarchical threads in memory
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Structure comments hierarchically
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    comments.forEach((c) => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    commentMap.forEach((c) => {
      if (c.parentId) {
        const parent = commentMap.get(c.parentId);
        if (parent) {
          parent.replies.push(c);
        } else {
          // If parent is missing (e.g. deleted), treat as root comment
          rootComments.push(c);
        }
      } else {
        rootComments.push(c);
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
