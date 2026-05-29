"use client";

import { useEffect, useRef } from "react";

type PusherClient = {
  subscribe: (channel: string) => {
    bind: (event: string, cb: (data: unknown) => void) => void;
    unbind: (event: string) => void;
  };
  unsubscribe: (channel: string) => void;
  disconnect: () => void;
};

export function usePusherChannel(
  channelName: string | null,
  event: string,
  onEvent: (data: unknown) => void
) {
  const pusherRef = useRef<PusherClient | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster || !channelName) return;

    let cancelled = false;

    (async () => {
      const PusherJS = (await import("pusher-js")).default;
      if (cancelled) return;

      const pusher = new PusherJS(key, {
        cluster,
        authEndpoint: "/api/pusher/auth",
      }) as unknown as PusherClient;

      pusherRef.current = pusher;
      const channel = pusher.subscribe(channelName);
      channel.bind(event, (data) => onEventRef.current(data));
    })();

    return () => {
      cancelled = true;
      if (pusherRef.current && channelName) {
        try {
          pusherRef.current.unsubscribe(channelName);
          pusherRef.current.disconnect();
        } catch {
          /* ignore */
        }
        pusherRef.current = null;
      }
    };
  }, [channelName, event]);
}
