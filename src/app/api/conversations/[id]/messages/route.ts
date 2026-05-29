import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageCreateSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { sanitizeText } from "@/lib/sanitize";
import { triggerConversationEvent } from "@/lib/pusher";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: conversationId } = await params;

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUser.id,
        },
      },
    });

    if (!participant || participant.leftAt !== null) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100);
    const cursor = searchParams.get("cursor") || undefined;

    // Mark messages from others in this conversation as DELIVERED
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        status: "SENT",
        deletedAt: null,
      },
      data: {
        status: "DELIVERED",
      },
    });

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
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

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    // Format the messages to flatten sender details if desired or keep as is
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      status: msg.status,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        username: msg.sender.username,
        displayName: msg.sender.profile?.displayName || null,
        avatarUrl: msg.sender.profile?.avatarUrl || null,
      },
    }));

    return NextResponse.json({
      messages: formattedMessages,
      nextCursor,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: conversationId } = await params;

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUser.id,
        },
      },
    });

    if (!participant || participant.leftAt !== null) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const result = messageCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid message content", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mediaUrl } = result.data;
    const content = sanitizeText(result.data.content);

    // Determine message type
    let messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE" = "TEXT";
    if (body.type && ["TEXT", "IMAGE", "VIDEO", "FILE"].includes(body.type)) {
      messageType = body.type;
    } else if (mediaUrl) {
      const lower = mediaUrl.toLowerCase();
      if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg)/)) {
        messageType = "IMAGE";
      } else if (lower.match(/\.(mp4|webm|ogg|mov)/)) {
        messageType = "VIDEO";
      } else {
        messageType = "FILE";
      }
    }

    // Use transaction to create message, update conversation updatedAt, and create notification
    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: currentUser.id,
          content,
          type: messageType,
          mediaUrl: mediaUrl || null,
          status: "SENT",
        },
        include: {
          sender: {
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

      // Update conversation's updatedAt timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // Fetch other participants to notify them
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: currentUser.id },
        leftAt: null,
      },
    });

    // Create notifications for other active participants
    for (const part of otherParticipants) {
      await createNotification({
        recipientId: part.userId,
        actorId: currentUser.id,
        type: "MESSAGE",
        targetId: newMessage.id,
      });
    }

    const formattedMessage = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      content: newMessage.content,
      type: newMessage.type,
      mediaUrl: newMessage.mediaUrl,
      status: newMessage.status,
      createdAt: newMessage.createdAt,
      sender: {
        id: newMessage.sender.id,
        username: newMessage.sender.username,
        displayName: newMessage.sender.profile?.displayName || null,
        avatarUrl: newMessage.sender.profile?.avatarUrl || null,
      },
    };

    await triggerConversationEvent(conversationId, "message:new", formattedMessage);

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
