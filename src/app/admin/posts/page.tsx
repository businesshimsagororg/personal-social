"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/app/admin/layout";
import { FileText, Heart, Loader2, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

interface AdminPost {
  id: string;
  content: string;
  visibility: string;
  createdAt: string;
  deletedAt: string | null;
  authorUsername: string;
  authorDisplayName?: string | null;
  authorStatus: string;
  commentCount: number;
  likeCount: number;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?limit=80&deleted=${showDeleted}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      toast.error("Could not load posts");
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            All posts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review community content across the network
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="rounded border-border"
          />
          Include soft-deleted posts
        </label>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts found.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className={`glass p-4 rounded-xl border ${
                  p.deletedAt ? "border-destructive/40 opacity-70" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground">
                    {p.authorDisplayName || p.authorUsername}
                  </span>
                  <span>@{p.authorUsername}</span>
                  <span>· {p.visibility}</span>
                  <span>· {new Date(p.createdAt).toLocaleString()}</span>
                  {p.deletedAt && (
                    <span className="text-destructive font-semibold">DELETED</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{p.content}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {p.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {p.commentCount}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
