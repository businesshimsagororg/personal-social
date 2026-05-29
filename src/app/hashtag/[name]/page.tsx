"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import PostCard from "@/components/posts/post-card";
import { Hash, Loader2 } from "lucide-react";

export default function HashtagPage() {
  const params = useParams();
  const name = params?.name as string;
  const [posts, setPosts] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentUserId(d?.user?.id));

    fetch(`/api/hashtags/${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : { posts: [], postCount: 0 }))
      .then((d) => {
        setPosts(d.posts || []);
        setPostCount(d.postCount || 0);
      })
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Hash className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">#{name}</h1>
            <p className="text-sm text-muted-foreground">{postCount} posts</p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No public posts with this tag yet.</p>
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
