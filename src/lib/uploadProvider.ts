import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type UploadResult = {
  url: string;
  type: "IMAGE" | "VIDEO";
  size: number;
};

export async function saveUploadedFile(
  file: File,
  appOrigin: string
): Promise<UploadResult> {
  const mime = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());
  const size = buffer.length;

  if (IMAGE_TYPES.has(mime)) {
    if (size > MAX_IMAGE_BYTES) {
      throw new Error("Image must be 5MB or smaller");
    }
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.webp`;
    const filepath = path.join(uploadsDir, filename);
    await sharp(buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filepath);
    return {
      url: `${appOrigin}/uploads/${filename}`,
      type: "IMAGE",
      size,
    };
  }

  if (VIDEO_TYPES.has(mime)) {
    if (size > MAX_VIDEO_BYTES) {
      throw new Error("Video must be 50MB or smaller");
    }
    const ext = mime === "video/webm" ? "webm" : mime === "video/quicktime" ? "mov" : "mp4";
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), buffer);
    return {
      url: `${appOrigin}/uploads/${filename}`,
      type: "VIDEO",
      size,
    };
  }

  throw new Error("Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, or WebM.");
}
