import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canViewerAccessPost } from "@/lib/post-access";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: postId } = await params;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (!(await canViewerAccessPost(user.id, post))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.share.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      create: { userId: user.id, postId },
      update: {},
    });

    const count = await prisma.share.count({ where: { postId } });
    return NextResponse.json({ message: "Post shared", sharesCount: count });
  } catch (error) {
    console.error("Share post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: postId } = await params;
    await prisma.share.deleteMany({ where: { userId: user.id, postId } });
    const count = await prisma.share.count({ where: { postId } });
    return NextResponse.json({ message: "Share removed", sharesCount: count });
  } catch (error) {
    console.error("Unshare post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
