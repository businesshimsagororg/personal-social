import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_LIMIT = 60;
const WINDOW_MS = 60_000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(
  req: NextRequest,
  options?: { limit?: number; prefix?: string }
): Promise<NextResponse | null> {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const prefix = options?.prefix ?? "api";
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;

  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, Math.ceil(WINDOW_MS / 1000));
      }
      if (count > limit) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
      }
      return null;
    } catch (e) {
      console.error("Redis rate limit error:", e);
    }
  }

  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  return null;
}
