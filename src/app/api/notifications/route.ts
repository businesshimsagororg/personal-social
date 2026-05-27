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
      const count = await prisma.notification.count({
        where: {
          recipientId: currentUser.id,
          read: false,
        },
      });
      return NextResponse.json({ unreadCount: count });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        actor: {
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

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      actor: {
        id: n.actor.id,
        username: n.actor.username,
        displayName: n.actor.profile?.displayName || null,
        avatarUrl: n.actor.profile?.avatarUrl || null,
      },
      type: n.type,
      targetId: n.targetId,
      read: n.read,
      createdAt: n.createdAt,
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
