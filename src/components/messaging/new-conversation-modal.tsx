"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface UserResult {
  id: string;
  username: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch when query is non‑empty
useEffect(() => {
  if (!searchQuery.trim()) return; // nothing to fetch

  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  setLoading(true);
  searchTimeoutRef.current = setTimeout(async () => {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      }
    } catch (err) {
      console.error('Error searching users', err);
    } finally {
      setLoading(false);
    }
  }, 400);

  return () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  };
}, [searchQuery]);

  const handleStartChat = async (userId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        onConversationCreated(data.conversation.id);
        onClose();
        setSearchQuery("");
      }
    } catch (err) {
      console.error("Error starting conversation", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl glass border border-border/80 shadow-2xl animate-fade-in z-10 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="text-lg font-bold text-foreground">New Message</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-xs">Searching users...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((user) => {
              const displayName = user.profile?.displayName || user.username;
              const initials = user.username.substring(0, 2).toUpperCase();
              return (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  disabled={submitting}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border/30 text-left transition disabled:opacity-50"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner">
                    {user.profile?.avatarUrl ? (
                      <Image
                        src={user.profile.avatarUrl}
                        alt={user.username}
                        className="h-full w-full object-cover rounded-xl"
                        width={40}
                        height={40}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </button>
              );
            })
          ) : searchQuery.trim() ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No community members found matching &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">Search for users to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
