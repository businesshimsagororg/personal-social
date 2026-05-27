import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Mark messages not sent by user as READ
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        status: { not: "READ" },
        deletedAt: null,
      },
      data: {
        status: "READ",
      },
    });

    return NextResponse.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
