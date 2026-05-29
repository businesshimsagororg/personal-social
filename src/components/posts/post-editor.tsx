"use client";

import React, { useState } from "react";
import { Globe, Image as ImageIcon, Lock, Send, Users } from "lucide-react";
import UploadDropzone, { type UploadedMedia } from "@/components/UploadDropzone";

interface PostEditorProps {
  onPostCreated: () => void;
}

export default function PostEditor({ onPostCreated }: PostEditorProps) {
  const [content, setContent] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "MUTUALS" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    const media = uploadedMedia
      ? [uploadedMedia]
      : mediaUrl.trim()
        ? [{ url: mediaUrl.trim(), type: "IMAGE" as const, size: 0 }]
        : [];

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, media, visibility }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      setContent("");
      setMediaUrl("");
      setUploadedMedia(null);
      setShowMediaInput(false);
      onPostCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (v: string) => {
    switch (v) {
      case "PUBLIC":
        return <Globe className="h-4 w-4" />;
      case "FOLLOWERS":
        return <Users className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  return (
    <div className="glass rounded-3xl p-5 border border-border/80 shadow-md mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            required
            rows={3}
            maxLength={2000}
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent border-0 resize-none text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 text-sm md:text-base leading-relaxed"
          />
        </div>

        {showMediaInput && (
          <div className="space-y-3 animate-fade-in">
            <UploadDropzone
              previewUrl={uploadedMedia?.url}
              onUploaded={(m) => {
                setUploadedMedia(m);
                setMediaUrl("");
              }}
              onClear={() => setUploadedMedia(null)}
            />
            <input
              type="url"
              placeholder="Or paste image/media URL..."
              value={mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                if (e.target.value) setUploadedMedia(null);
              }}
              disabled={Boolean(uploadedMedia)}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition disabled:opacity-50"
            />
          </div>
        )}

        {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`p-2.5 rounded-xl transition ${
                showMediaInput
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
              title="Add media"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/50 text-muted-foreground text-xs font-semibold cursor-pointer">
              {getVisibilityIcon(visibility)}
              <select
                value={visibility}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setVisibility(e.target.value as typeof visibility)
                }
                className="bg-transparent border-none p-0 pr-1 text-xs focus:outline-none focus:ring-0 cursor-pointer font-bold text-foreground"
              >
                <option value="PUBLIC" className="bg-background text-foreground">
                  Public Feed
                </option>
                <option value="FOLLOWERS" className="bg-background text-foreground">
                  Followers Only
                </option>
                <option value="MUTUALS" className="bg-background text-foreground">
                  Mutuals Only
                </option>
                <option value="PRIVATE" className="bg-background text-foreground">
                  Private/Only Me
                </option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition shadow-[0_4px_15px_rgba(139,92,246,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <span>Publish</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
