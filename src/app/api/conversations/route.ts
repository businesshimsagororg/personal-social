import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const unreadCountOnly = searchParams.get("unreadCount") === "true";

    if (unreadCountOnly) {
      const count = await prisma.message.count({
        where: {
          conversation: {
            participants: {
              some: {
                userId: currentUser.id,
                leftAt: null,
              },
            },
          },
          senderId: { not: currentUser.id },
          status: { not: "READ" },
          deletedAt: null,
        },
      });
      return NextResponse.json({ unreadCount: count });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUser.id,
            leftAt: null,
          },
        },
      },
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: currentUser.id },
            status: { not: "READ" },
            deletedAt: null,
          },
        });

        const otherParticipants = conv.participants
          .filter((p) => p.userId !== currentUser.id)
          .map((p) => ({
            id: p.user.id,
            username: p.user.username,
            displayName: p.user.profile?.displayName || null,
            avatarUrl: p.user.profile?.avatarUrl || null,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
          }));

        return {
          id: conv.id,
          isGroup: conv.isGroup,
          name: conv.name,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          otherParticipants,
          lastMessage: conv.messages[0] || null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (Array.isArray(body.participantIds) && body.participantIds.length >= 2) {
      const ids = [...new Set([currentUser.id, ...body.participantIds])] as string[];
      if (ids.length < 3) {
        return NextResponse.json(
          { error: "Group chats need at least 2 other members" },
          { status: 400 }
        );
      }

      const newGroup = await prisma.conversation.create({
        data: {
          isGroup: true,
          name: typeof body.name === "string" ? body.name.slice(0, 80) : "Group chat",
          participants: {
            create: ids.map((userId) => ({ userId })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { displayName: true, avatarUrl: true } },
                },
              },
            },
          },
        },
      });

      return NextResponse.json(
        {
          conversation: {
            id: newGroup.id,
            isGroup: true,
            name: newGroup.name,
            otherParticipants: newGroup.participants
              .filter((p) => p.userId !== currentUser.id)
              .map((p) => ({
                id: p.user.id,
                username: p.user.username,
                displayName: p.user.profile?.displayName ?? null,
                avatarUrl: p.user.profile?.avatarUrl ?? null,
              })),
            unreadCount: 0,
          },
        },
        { status: 201 }
      );
    }

    const recipientId = body.recipientId ?? body.userId;

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 });
    }

    if (recipientId === currentUser.id) {
      return NextResponse.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
    }

    // Check if recipient user exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 404 });
    }

    // Check if a 1:1 conversation already exists between the two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          {
            participants: {
              some: { userId: currentUser.id },
            },
          },
          {
            participants: {
              some: { userId: recipientId },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });

    if (existingConversation) {
      // If any of the participants had left, reset leftAt to null
      const leftParticipants = existingConversation.participants.filter(
        (p) => p.leftAt !== null
      );

      if (leftParticipants.length > 0) {
        await prisma.conversationParticipant.updateMany({
          where: {
            conversationId: existingConversation.id,
            userId: { in: [currentUser.id, recipientId] },
          },
          data: {
            leftAt: null,
          },
        });
      }

      // Fetch the full details
      const fullConversation = await prisma.conversation.findUnique({
        where: { id: existingConversation.id },
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

      if (!fullConversation) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }

      const otherParticipants = fullConversation.participants
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
        conversation: {
          id: fullConversation.id,
          isGroup: fullConversation.isGroup,
          name: fullConversation.name,
          createdAt: fullConversation.createdAt,
          updatedAt: fullConversation.updatedAt,
          otherParticipants,
          lastMessage: fullConversation.messages[0] || null,
          unreadCount: 0,
        },
      });
    }

    // Create a new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: currentUser.id },
            { userId: recipientId },
          ],
        },
      },
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
      },
    });

    const otherParticipants = newConversation.participants
      .filter((p) => p.userId !== currentUser.id)
      .map((p) => ({
        id: p.user.id,
        username: p.user.username,
        displayName: p.user.profile?.displayName || null,
        avatarUrl: p.user.profile?.avatarUrl || null,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
      }));

    return NextResponse.json(
      {
        conversation: {
          id: newConversation.id,
          isGroup: newConversation.isGroup,
          name: newConversation.name,
          createdAt: newConversation.createdAt,
          updatedAt: newConversation.updatedAt,
          otherParticipants,
          lastMessage: null,
          unreadCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
