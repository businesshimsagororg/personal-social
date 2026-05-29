import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30"), 1), 100);
  const cursor = searchParams.get("cursor") || undefined;

  const where = q
    ? {
        OR: [
          {
            participants: {
              some: {
                user: { username: { contains: q, mode: "insensitive" as const } },
              },
            },
          },
          {
            participants: {
              some: {
                user: {
                  profile: {
                    displayName: { contains: q, mode: "insensitive" as const },
                  },
                },
              },
            },
          },
        ],
      }
    : {};

  const rows = await prisma.conversation.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: {
              username: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      },
      _count: { select: { messages: true } },
    },
  });

  let nextCursor: string | undefined;
  if (rows.length > limit) {
    const next = rows.pop();
    nextCursor = next?.id;
  }

  await prisma.auditLog.create({
    data: {
      userId: auth.user!.id,
      action: "ADMIN_LIST_CONVERSATIONS",
      metadata: JSON.stringify({ query: q || null, count: rows.length }),
    },
  });

  return NextResponse.json({
    conversations: rows.map((c) => ({
      id: c.id,
      isGroup: c.isGroup,
      name: c.name,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messageCount: c._count.messages,
      participants: c.participants.map((p) => ({
        id: p.user.id,
        username: p.user.username,
        email: p.user.email,
        displayName: p.user.profile?.displayName ?? null,
        avatarUrl: p.user.profile?.avatarUrl ?? null,
        leftAt: p.leftAt?.toISOString() ?? null,
      })),
      lastMessage: c.messages[0]
        ? {
            id: c.messages[0].id,
            content: c.messages[0].content,
            type: c.messages[0].type,
            createdAt: c.messages[0].createdAt.toISOString(),
            senderUsername: c.messages[0].sender.username,
            senderDisplayName: c.messages[0].sender.profile?.displayName ?? null,
          }
        : null,
    })),
    nextCursor,
  });
}
