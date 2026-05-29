import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username } = await params;
    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const media = await prisma.media.findMany({
      where: {
        post: { authorId: target.id, deletedAt: null },
        type: { in: ["IMAGE", "VIDEO"] },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        url: true,
        type: true,
        postId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error("User media error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
