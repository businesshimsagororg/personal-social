import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 100);
  const includeDeleted = searchParams.get("deleted") === "true";

  const posts = await prisma.post.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      visibility: true,
      createdAt: true,
      deletedAt: true,
      author: {
        select: {
          id: true,
          username: true,
          status: true,
          profile: { select: { displayName: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      createdAt: p.createdAt.toISOString(),
      deletedAt: p.deletedAt?.toISOString() ?? null,
      authorId: p.author.id,
      authorUsername: p.author.username,
      authorDisplayName: p.author.profile?.displayName,
      authorStatus: p.author.status,
      commentCount: p._count.comments,
      likeCount: p._count.likes,
    })),
  });
}
