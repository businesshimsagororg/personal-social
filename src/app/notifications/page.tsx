"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import NotificationItem from "@/components/notifications/notification-item";
import { usePusherChannel } from "@/hooks/usePusher";
import { Bell, Check, Loader2, RefreshCw } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user?.id && setUserId(d.user.id))
      .catch(() => {});

    fetchNotifications();

    const interval = setInterval(() => fetchNotifications(true), 30000);
    return () => clearInterval(interval);
  }, []);

  usePusherChannel(
    userId ? `private-user-${userId}` : null,
    "notification:new",
    (payload) => {
      const n = payload as (typeof notifications)[0];
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
    }
  );

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PUT" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      try {
        await fetch(`/api/notifications/${notif.id}`, { method: "PUT" });
        // Update local state to show it is read
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch (e) {
        console.error("Failed to mark single notification as read", e);
      }
    }

    // Navigate to appropriate screen
    if (notif.type === "MESSAGE") {
      router.push("/messages");
    } else if (notif.type === "FOLLOW_REQUEST" || notif.type === "FOLLOW_ACCEPT") {
      router.push(`/profile/${notif.actor.username}`);
    } else {
      router.push("/feed");
    }
  };

  const groupNotifications = (list: any[]) => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const earlier: any[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    list.forEach((item) => {
      const date = new Date(item.createdAt);
      if (date >= startOfToday) {
        today.push(item);
      } else if (date >= startOfYesterday) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = groupNotifications(notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Notifications</h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
                  : "You are all caught up!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(true)}
              className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition border border-border/50"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary/15 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-2xl p-4 border border-border/80 shadow-lg animate-pulse flex gap-4">
                <div className="h-9 w-9 bg-muted rounded-xl shrink-0" />
                <div className="h-10 w-10 bg-muted rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3.5 w-2/3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-border/80 text-center space-y-4 shadow-lg">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No notifications yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When other community members follow, comment, mention or message you, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today Group */}
            {today.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase px-2">
                  Today
                </h3>
                <div className="space-y-2">
                  {today.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday Group */}
            {yesterday.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase px-2">
                  Yesterday
                </h3>
                <div className="space-y-2">
                  {yesterday.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Earlier Group */}
            {earlier.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase px-2">
                  Earlier
                </h3>
                <div className="space-y-2">
                  {earlier.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
