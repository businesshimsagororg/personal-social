"use client";

import React, { useRef, useState } from "react";
import { ImageIcon, Loader2, X } from "lucide-react";

export type UploadedMedia = {
  url: string;
  type: "IMAGE" | "VIDEO";
  size: number;
};

interface UploadDropzoneProps {
  onUploaded: (media: UploadedMedia) => void;
  onClear?: () => void;
  previewUrl?: string;
}

export default function UploadDropzone({ onUploaded, onClear, previewUrl }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(previewUrl || "");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPreview(data.url);
      onUploaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setPreview("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        className="hidden"
        onChange={onInputChange}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border max-h-48">
          {preview.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
            <video src={preview} controls className="w-full max-h-48 object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Upload preview" className="w-full max-h-48 object-cover" />
          )}
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 border border-border text-foreground hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition text-muted-foreground"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <ImageIcon className="h-6 w-6" />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Uploading..." : "Drop image/video or click to upload"}
          </span>
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
