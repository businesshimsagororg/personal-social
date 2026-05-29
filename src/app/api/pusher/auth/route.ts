import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 503 });
  }

  const form = await req.formData();
  const socketId = form.get("socket_id")?.toString();
  const channel = form.get("channel_name")?.toString();

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const userChannel = `private-user-${user.id}`;
  const convoPrefix = "private-conversation-";

  if (channel === userChannel) {
    const auth = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(auth);
  }

  if (channel.startsWith(convoPrefix)) {
    const conversationId = channel.slice(convoPrefix.length);
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });
    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const auth = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(auth);
  }

  return NextResponse.json({ error: "Invalid channel" }, { status: 403 });
}
