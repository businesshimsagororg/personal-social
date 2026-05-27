"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 glass border-t border-border/50 bg-background/30 rounded-2xl">
      <textarea
        ref={textareaRef}
        rows={1}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 max-h-40 min-h-[38px] py-2 px-3 rounded-xl border border-border bg-background/60 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition overflow-y-auto"
      />
      <button
        onClick={handleSend}
        disabled={!content.trim() || disabled}
        className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 transition shrink-0 flex items-center justify-center"
      >
        <Send className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
