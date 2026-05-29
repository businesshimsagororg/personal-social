import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerConversationEvent } from "@/lib/pusher";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: currentUser.id },
    },
  });

  if (!participant || participant.leftAt) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await triggerConversationEvent(conversationId, "typing", {
    userId: currentUser.id,
    username: currentUser.username,
    displayName: currentUser.profile?.displayName ?? null,
  });

  return NextResponse.json({ ok: true });
}
