import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: conversationId } = await params;

    // Check if the conversation exists and the current user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
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
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === currentUser.id && p.leftAt === null
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Compute unread count for this conversation
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: currentUser.id },
        status: { not: "READ" },
        deletedAt: null,
      },
    });

    const otherParticipants = conversation.participants
      .filter((p) => p.userId !== currentUser.id)
      .map((p) => ({
        id: p.user.id,
        username: p.user.username,
        displayName: p.user.profile?.displayName || null,
        avatarUrl: p.user.profile?.avatarUrl || null,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
      }));

    return NextResponse.json({
      id: conversation.id,
      isGroup: conversation.isGroup,
      name: conversation.name,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      otherParticipants,
      lastMessage: conversation.messages[0] || null,
      unreadCount,
    });
  } catch (error) {
    console.error("Error getting conversation details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
