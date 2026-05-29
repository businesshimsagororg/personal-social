"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PostCard from "@/components/posts/post-card";
import { Bookmark, Loader2 } from "lucide-react";

export default function SavedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>();

  useEffect(() => {
    Promise.all([fetch("/api/auth/me"), fetch("/api/bookmarks")]).then(async ([meRes, bookRes]) => {
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentUserId(me.user?.id);
      }
      if (bookRes.ok) {
        const data = await bookRes.json();
        setPosts(data.posts || []);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bookmark className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Saved posts</h1>
            <p className="text-sm text-muted-foreground">Posts you bookmarked</p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No saved posts yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
