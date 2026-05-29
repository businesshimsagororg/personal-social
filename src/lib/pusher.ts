import Pusher from "pusher";

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) return null;
  pusherServer = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return pusherServer;
}

export function isPusherConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
      process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER
  );
}

export async function triggerUserEvent(
  userId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  try {
    await pusher.trigger(`private-user-${userId}`, event, data);
  } catch (e) {
    console.error("Pusher trigger error:", e);
  }
}

export async function triggerConversationEvent(
  conversationId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  try {
    await pusher.trigger(`private-conversation-${conversationId}`, event, data);
  } catch (e) {
    console.error("Pusher conversation trigger error:", e);
  }
}
