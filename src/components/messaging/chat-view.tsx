"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import MessageInput from "./message-input";
import { usePusherChannel } from "@/hooks/usePusher";
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

interface Message {
  id: string;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  mediaUrl: string | null;
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
  onBack?: () => void;
}

export default function ChatView({ conversationId, currentUserId, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);







  // Poll for messages and mark read
  // Fetch conversation details
const fetchConvoDetails = useCallback(async () => {
  try {
    const res = await fetch(`/api/conversations/${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      const convo = data.conversation;
      if (convo) {
        const other = convo.participants.find((p: Participant) => p.userId !== currentUserId)?.user;
        setOtherUser(other || null);
      }
    }
  } catch (e) {
    console.error("Failed to fetch conversation details", e);
  }
}, [conversationId, currentUserId]);

// Fetch messages
const fetchMessages = useCallback(async (silent = false) => {
  if (!silent) setLoading(true);
  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
    if (res.ok) {
      const data = await res.json();
      const reversed = [...data.messages].reverse();
      setMessages(reversed);
      if (isInitialLoad.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        }, 50);
        isInitialLoad.current = false;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  } catch (e) {
    console.error("Failed to load messages", e);
  } finally {
    if (!silent) setLoading(false);
  }
}, [conversationId]);

// Mark as read
const markAsRead = useCallback(async () => {
  try {
    await fetch(`/api/conversations/${conversationId}/read`, { method: "PUT" });
  } catch (e) {
    console.error("Failed to mark conversation as read", e);
  }
}, [conversationId]);

useEffect(() => {
  isInitialLoad.current = true;
  fetchConvoDetails();
  fetchMessages();
  markAsRead();

  const interval = setInterval(() => {
    fetchMessages(true);
    markAsRead();
  }, 10000);

  return () => clearInterval(interval);
}, [fetchConvoDetails, fetchMessages, markAsRead]);

usePusherChannel(`private-conversation-${conversationId}`, "message:new", (payload) => {
  const msg = payload as Message;
  setMessages((prev) => {
    if (prev.some((m) => m.id === msg.id)) return prev;
    return [...prev, msg];
  });
  setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
});

  // Send message
  const handleSendMessage = async (content: string) => {
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type: "TEXT" }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message ?? data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgList: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgList.forEach((msg) => {
      const date = new Date(msg.createdAt);
      const dateStr = date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(msg);
    });
    return groups;
  };

  const grouped = groupMessagesByDate(messages);

  const getStatusIcon = (status: "SENT" | "DELIVERED" | "READ") => {
    if (status === "READ") {
      return (
        <span className="text-violet-400 font-bold ml-1 text-[10px]" title="Read">
          ✓✓
        </span>
      );
    }
    if (status === "DELIVERED") {
      return (
        <span className="text-muted-foreground ml-1 text-[10px]" title="Delivered">
          ✓✓
        </span>
      );
    }
    return (
      <span className="text-muted-foreground ml-1 text-[10px]" title="Sent">
        ✓
      </span>
    );
  };

  const initials = otherUser?.username?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="flex flex-col h-full bg-background/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/30 glass">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {otherUser ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner">
              {otherUser.profile?.avatarUrl ? (
                <Image
                  src={otherUser.profile.avatarUrl}
                  alt={otherUser.username}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                initials
              )}
            </div>
            <div className="overflow-hidden leading-tight">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {otherUser.profile?.displayName || otherUser.username}
              </h3>
              <p className="text-xs text-muted-foreground truncate">@{otherUser.username}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted animate-pulse shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`flex gap-3 max-w-[70%] ${n % 2 === 0 ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className="h-8 w-8 rounded-lg bg-muted shrink-0 animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-10 bg-muted/55 rounded-2xl animate-pulse" />
                  <div className="h-2 w-12 bg-muted/40 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground space-y-2">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">Start the conversation</p>
            <p className="text-xs max-w-xs">Messages are private and secure.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <div className="border-t border-border/40 flex-grow" />
                <span className="mx-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {date}
                </span>
                <div className="border-t border-border/40 flex-grow" />
              </div>

              {msgs.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex gap-2.5 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    {!isMe && (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-inner">
                        {msg.sender.profile?.avatarUrl ? (
                          <img
                            src={msg.sender.profile.avatarUrl}
                            alt={msg.sender.username}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          msg.sender.username.substring(0, 2).toUpperCase()
                        )}
                      </div>
                    )}
                    <div className="flex flex-col group">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-[0_2px_8px_rgba(139,92,246,0.15)]"
                            : "bg-muted/70 text-foreground border border-border/30 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <div
                        className={`flex items-center text-[9px] text-muted-foreground mt-1 px-1 opacity-60 group-hover:opacity-100 transition ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3">
        <MessageInput onSend={handleSendMessage} disabled={sending} />
      </div>
    </div>
  );
}
