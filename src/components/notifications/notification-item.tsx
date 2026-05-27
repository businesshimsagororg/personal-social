"use client";

import React from "react";
import Image from "next/image";
import { Heart, MessageCircle, UserPlus, AtSign, Mail, UserCheck } from "lucide-react";

interface Actor {
  id: string;
  username: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface Notification {
  id: string;
  type: "LIKE_POST" | "LIKE_COMMENT" | "COMMENT" | "FOLLOW_REQUEST" | "FOLLOW_ACCEPT" | "MENTION" | "MESSAGE";
  targetId: string | null;
  read: boolean;
  createdAt: string;
  actor: Actor;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getNotificationContent = (type: string, name: string) => {
    switch (type) {
      case "LIKE_POST":
        return {
          text: "liked your post",
          icon: Heart,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        };
      case "LIKE_COMMENT":
        return {
          text: "liked your comment",
          icon: Heart,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        };
      case "COMMENT":
        return {
          text: "commented on your post",
          icon: MessageCircle,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        };
      case "FOLLOW_REQUEST":
        return {
          text: "requested to follow you",
          icon: UserPlus,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        };
      case "FOLLOW_ACCEPT":
        return {
          text: "accepted your follow request",
          icon: UserCheck,
          color: "text-green-500 bg-green-500/10 border-green-500/20",
        };
      case "MENTION":
        return {
          text: "mentioned you in a post",
          icon: AtSign,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        };
      case "MESSAGE":
        return {
          text: "sent you a message",
          icon: Mail,
          color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
        };
      default:
        return {
          text: "interacted with you",
          icon: MessageCircle,
          color: "text-primary bg-primary/10 border-primary/20",
        };
    }
  };

  const actorName = notification.actor.profile?.displayName || notification.actor.username;
  const content = getNotificationContent(notification.type, actorName);
  const Icon = content.icon;
  const initials = notification.actor.username.substring(0, 2).toUpperCase();

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={() => onClick(notification)}
      className={`relative flex items-start gap-4 p-4 rounded-2xl border text-left cursor-pointer transition ${
        notification.read
          ? "bg-transparent border-border/30 hover:bg-muted/30"
          : "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-[0_2px_10px_rgba(139,92,246,0.05)]"
      }`}
    >
      {/* Unread dot */}
      {!notification.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}

      {/* Type Icon Badge */}
      <div className={`p-2 rounded-xl border shrink-0 ${content.color}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Actor Avatar */}
      <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner">
        {notification.actor.profile?.avatarUrl ? (
          <Image
            src={notification.actor.profile.avatarUrl}
            alt={notification.actor.username}
            width={40}
            height={40}
            className="h-full w-full object-cover rounded-xl"
          />
        ) : (
          initials
        )}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-bold text-foreground hover:underline">
            {actorName}
          </span>{" "}
          <span className="text-muted-foreground">{content.text}</span>
        </p>
        <span className="text-[10px] font-semibold text-muted-foreground mt-1 block">
          {getRelativeTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );
}
