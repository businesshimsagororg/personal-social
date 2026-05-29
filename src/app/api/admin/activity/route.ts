import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100"), 1), 200);
  const action = searchParams.get("action")?.trim();

  const logs = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      metadata: l.metadata,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
      userId: l.userId,
      username: l.user?.username ?? null,
      email: l.user?.email ?? null,
    })),
  });
}
