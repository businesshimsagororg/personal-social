"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/app/admin/layout";
import { ArrowLeft, Loader2, Mail, Search, Shield } from "lucide-react";
import { toast } from "react-hot-toast";

interface Participant {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  leftAt: string | null;
}

interface ConversationRow {
  id: string;
  isGroup: boolean;
  name: string | null;
  updatedAt: string;
  messageCount: number;
  participants: Participant[];
  lastMessage: {
    content: string;
    senderUsername: string;
    createdAt: string;
  } | null;
}

interface AdminMessage {
  id: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
  sender: {
    username: string;
    email: string;
    displayName: string | null;
  };
}

function participantLabel(p: Participant) {
  return p.displayName ? `${p.displayName} (@${p.username})` : `@${p.username}`;
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [activeMeta, setActiveMeta] = useState<ConversationRow | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/conversations?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load conversations");
      }
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load conversations");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchConversations(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchConversations, search]);

  const fetchMessages = useCallback(async (conversationId: string, withDeleted: boolean) => {
    setDetailLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (withDeleted) params.set("includeDeleted", "true");
      const res = await fetch(`/api/admin/conversations/${conversationId}?${params}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error("Could not load message history");
      setMessages([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectConversation = (row: ConversationRow) => {
    setActiveId(row.id);
    setActiveMeta(row);
    fetchMessages(row.id, includeDeleted);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.role !== "ADMIN") {
          toast.error("Only administrators can view private messages");
          window.location.href = "/admin";
        }
      })
      .catch(() => {});
  }, []);

  const showDetailOnMobile = activeId !== null;

  return (
    <AdminLayout>
      <div className="space-y-4 w-full max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" />
            Direct messages
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
            <Shield className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            Admin-only: review private conversations between members. Access is logged.
          </p>
        </div>

        <div className="glass rounded-2xl border border-border overflow-hidden flex flex-col md:flex-row min-h-[min(75dvh,640px)]">
          <div
            className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 ${
              showDetailOnMobile ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search by username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No conversations found.</p>
              ) : (
                <ul>
                  {conversations.map((c) => {
                    const title = c.isGroup
                      ? c.name || "Group chat"
                      : c.participants.map(participantLabel).join(" ↔ ");
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => selectConversation(c)}
                          className={`w-full text-left p-3 border-b border-border/50 hover:bg-muted/30 transition ${
                            activeId === c.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{title}</p>
                          {c.lastMessage && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {c.lastMessage.senderUsername}: {c.lastMessage.content}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {c.messageCount} message{c.messageCount === 1 ? "" : "s"}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col min-h-0 ${
              showDetailOnMobile ? "flex" : "hidden md:flex"
            }`}
          >
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
                Select a conversation to view the full message history.
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(null);
                      setActiveMeta(null);
                      setMessages([]);
                    }}
                    className="md:hidden p-2 rounded-lg hover:bg-muted"
                    aria-label="Back to list"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {activeMeta?.isGroup
                        ? activeMeta.name || "Group"
                        : activeMeta?.participants.map(participantLabel).join(" ↔ ")}
                    </p>
                    {activeMeta?.participants.map((p) => (
                      <p key={p.id} className="text-xs text-muted-foreground truncate">
                        <Link href={`/profile/${p.username}`} className="text-primary hover:underline">
                          @{p.username}
                        </Link>
                        {" · "}
                        {p.email}
                      </p>
                    ))}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs shrink-0">
                    <input
                      type="checkbox"
                      checked={includeDeleted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeDeleted(checked);
                        if (activeId) fetchMessages(activeId, checked);
                      }}
                      className="rounded border-border"
                    />
                    Deleted
                  </label>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {detailLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">No messages in this chat.</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-xl p-3 border text-sm ${
                          m.deletedAt
                            ? "border-destructive/30 bg-destructive/5 opacity-80"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {m.sender.displayName || m.sender.username}
                            <span className="text-muted-foreground font-normal"> @{m.sender.username}</span>
                          </span>
                          <time className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(m.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap break-words">{m.content}</p>
                        {m.mediaUrl && (
                          <a
                            href={m.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary mt-2 inline-block hover:underline"
                          >
                            View attachment
                          </a>
                        )}
                        {m.deletedAt && (
                          <p className="text-[10px] text-destructive mt-1">Soft-deleted</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
