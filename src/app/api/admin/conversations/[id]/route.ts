import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id: conversationId } = await params;
  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get("includeDeleted") === "true";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100"), 1), 200);
  const cursor = searchParams.get("cursor") || undefined;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              status: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  let nextCursor: string | undefined;
  if (messages.length > limit) {
    const next = messages.pop();
    nextCursor = next?.id;
  }

  await prisma.auditLog.create({
    data: {
      userId: auth.user!.id,
      action: "ADMIN_VIEW_CONVERSATION",
      metadata: JSON.stringify({
        conversationId,
        messageCount: messages.length,
      }),
    },
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      isGroup: conversation.isGroup,
      name: conversation.name,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      participants: conversation.participants.map((p) => ({
        id: p.user.id,
        username: p.user.username,
        email: p.user.email,
        status: p.user.status,
        displayName: p.user.profile?.displayName ?? null,
        avatarUrl: p.user.profile?.avatarUrl ?? null,
        joinedAt: p.joinedAt.toISOString(),
        leftAt: p.leftAt?.toISOString() ?? null,
      })),
    },
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      mediaUrl: m.mediaUrl,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      deletedAt: m.deletedAt?.toISOString() ?? null,
      sender: {
        id: m.sender.id,
        username: m.sender.username,
        email: m.sender.email,
        displayName: m.sender.profile?.displayName ?? null,
        avatarUrl: m.sender.profile?.avatarUrl ?? null,
      },
    })),
    nextCursor,
  });
}
