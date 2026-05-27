"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import Image from "next/image";

interface Participant {
  userId: string;
  user: {
    id: string;
    username: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  updatedAt: string;
  participants: Participant[];
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredConversations = conversations.filter((conversation) => {
    if (!filterQuery.trim()) return true;
    
    if (conversation.isGroup && conversation.name) {
      return conversation.name.toLowerCase().includes(filterQuery.toLowerCase());
    }

    // Search participant names/usernames
    const query = filterQuery.toLowerCase();
    return conversation.participants.some(
      (p) =>
        p.userId !== currentUserId &&
        (p.user.username.toLowerCase().includes(query) ||
          p.user.profile?.displayName?.toLowerCase().includes(query))
    );
  });

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.userId !== currentUserId)?.user;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border/50">
        <h2 className="text-xl font-bold text-foreground">Messages</h2>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm active:scale-95 transition"
          title="New Message"
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Local Filter search bar */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter conversations..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background/40 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((convo) => {
            const isActive = convo.id === activeId;
            const otherUser = getOtherParticipant(convo);
            const title = convo.isGroup
              ? convo.name || "Group Chat"
              : otherUser?.profile?.displayName || otherUser?.username || "Unknown User";
            const subtitle = convo.isGroup ? "" : otherUser ? `@${otherUser.username}` : "";
            const initials = (convo.isGroup
              ? convo.name || "GC"
              : otherUser?.username || "U"
            ).substring(0, 2).toUpperCase();

            const avatarUrl = convo.isGroup ? null : otherUser?.profile?.avatarUrl;

            return (
              <button
                key={convo.id}
                onClick={() => onSelect(convo.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                  isActive
                    ? "bg-primary/15 border-primary/30 shadow-[0_4px_12px_rgba(139,92,246,0.1)]"
                    : "bg-transparent border-transparent hover:bg-muted/40 hover:border-border/30"
                }`}
              >
                {/* Avatar */}
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-inner border transition ${
                  isActive ? "bg-primary/25 border-primary/45 text-primary" : "bg-primary/10 border-primary/20 text-primary"
                }`}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={title}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Text Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span className={`font-semibold text-sm truncate ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                      {title}
                    </span>
                    {convo.lastMessage && (
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {getRelativeTime(convo.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1 font-medium">
                      {convo.lastMessage ? convo.lastMessage.content : subtitle || "No messages yet"}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shrink-0 animate-pulse">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
