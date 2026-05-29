"use client";

import React, { useState, useRef, useEffect } from "react";
import { ImagePlus, Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, options?: { mediaUrl?: string; type?: string }) => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const handleSend = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        onSend(content.trim() || "📷 Image", {
          mediaUrl: data.url,
          type: "IMAGE",
        });
        setContent("");
      }
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 glass border-t border-border/50 bg-background/30 rounded-2xl">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => fileRef.current?.click()}
        className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted shrink-0"
        aria-label="Send image"
      >
        <ImagePlus className="h-5 w-5" />
      </button>
      <textarea
        ref={textareaRef}
        rows={1}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onTyping?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled || uploading}
        className="flex-1 max-h-40 min-h-[38px] py-2 px-3 rounded-xl border border-border bg-background/60 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition overflow-y-auto"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!content.trim() || disabled || uploading}
        className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition shrink-0"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
