import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";

const noteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { id } = await params;
  const notes = await prisma.adminUserNote.findMany({
    where: { targetUserId: id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, role: true } },
    },
  });

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      note: n.note,
      authorUsername: n.author.username,
      authorRole: n.author.role,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { id: targetUserId } = await params;
  const body = await req.json();
  const result = noteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const created = await prisma.adminUserNote.create({
    data: {
      targetUserId,
      authorId: auth.user!.id,
      note: result.data.note,
    },
  });

  return NextResponse.json({
    note: {
      id: created.id,
      note: created.note,
      createdAt: created.createdAt.toISOString(),
    },
  });
}
