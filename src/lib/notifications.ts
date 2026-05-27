import { prisma } from "./prisma";

export type NotificationType =
  | "LIKE_POST"
  | "LIKE_COMMENT"
  | "COMMENT"
  | "FOLLOW_REQUEST"
  | "FOLLOW_ACCEPT"
  | "MENTION"
  | "MESSAGE";

/**
 * Create a notification for a user.
 * Won't create if actor === recipient (no self-notifications).
 */
export async function createNotification({
  recipientId,
  actorId,
  type,
  targetId,
}: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  targetId?: string;
}) {
  // Don't notify yourself
  if (recipientId === actorId) return null;

  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        actorId,
        type,
        targetId: targetId || null,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      read: false,
    },
  });
}

/**
 * Get unread message count for a user (total across all conversations)
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  // Get all conversations the user is part of
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId, leftAt: null },
    select: { conversationId: true },
  });

  const conversationIds = participations.map((p) => p.conversationId);

  if (conversationIds.length === 0) return 0;

  // Count messages in those conversations that are not sent by the user and not READ
  const count = await prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      status: { not: "READ" },
      deletedAt: null,
    },
  });

  return count;
}
