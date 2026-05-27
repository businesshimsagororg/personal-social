"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import ConversationList from "@/components/messaging/conversation-list";
import ChatView from "@/components/messaging/chat-view";
import NewConversationModal from "@/components/messaging/new-conversation-modal";
import { MessageSquare, Mail, Sparkles } from "lucide-react";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current user details
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching user session", err);
    }
  };

  // Fetch conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchConversations();

    // 10s poll for conversations list
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleConversationCreated = (conversationId: string) => {
    setActiveId(conversationId);
    fetchConversations(true);
  };

  // Check if we show the detail view on mobile
  const showChatOnMobile = activeId !== null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Direct Messages</h1>
            <p className="text-xs text-muted-foreground">Private discussions with community members</p>
          </div>
        </div>

        {/* Messaging Pane Container */}
        <div className="glass rounded-3xl border border-border/80 shadow-2xl overflow-hidden h-[600px] flex">
          {/* Conversation List Pane */}
          <div
            className={`w-full md:w-80 border-r border-border/50 h-full flex flex-col transition-all duration-300 shrink-0 ${
              showChatOnMobile ? "hidden md:flex" : "flex"
            }`}
          >
            {loading && conversations.length === 0 ? (
              <div className="p-4 space-y-4 flex-1">
                <div className="h-9 bg-muted rounded-xl animate-pulse" />
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex gap-3 items-center p-2">
                    <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                currentUserId={currentUser?.id}
                onSelect={setActiveId}
                onNewChat={() => setIsModalOpen(true)}
              />
            )}
          </div>

          {/* Active Chat Pane */}
          <div
            className={`flex-1 h-full flex flex-col ${
              showChatOnMobile ? "flex" : "hidden md:flex"
            }`}
          >
            {activeId && currentUser ? (
              <ChatView
                conversationId={activeId}
                currentUserId={currentUser.id}
                onBack={() => setActiveId(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-4">
                <div className="p-4 bg-primary/5 rounded-full border border-primary/10 text-primary/70 animate-pulse">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-base font-bold text-foreground">No Chat Selected</h3>
                <p className="text-xs max-w-xs leading-relaxed">
                  Choose a contact from the list or start a new conversation to begin messaging.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-md active:scale-95"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <NewConversationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </AppLayout>
  );
}
