import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import type { User } from "@prisma/client";

type ModeratorResult =
  | { error: NextResponse; user: null }
  | { error: null; user: User };

export async function requireModerator(): Promise<ModeratorResult> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

type AdminResult =
  | { error: NextResponse; user: null }
  | { error: null; user: User };

export async function requireAdmin(): Promise<AdminResult> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}
