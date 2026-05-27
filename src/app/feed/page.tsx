"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PostEditor from "@/components/posts/post-editor";
import PostCard from "@/components/posts/post-card";
import { Sparkles } from "lucide-react";

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/posts?limit=30");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Failed to load feed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load currentUser session to pass down to cards (for likes check)
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user.id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkUser();
    fetchFeed();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Home Feed</h1>
            <p className="text-xs text-muted-foreground">Catch up on what the community is sharing</p>
          </div>
        </div>

        {/* Post Publisher */}
        <PostEditor onPostCreated={fetchFeed} />

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-3xl p-6 border border-border/80 shadow-lg animate-pulse space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-1/4 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-16 bg-muted rounded-xl" />
                <div className="h-8 bg-muted rounded-xl w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-border/80 text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nothing here yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Be the first to publish a post and start a conversation in our closed community network!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
