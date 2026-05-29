import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";
import { inviteCreateSchema } from "@/lib/validations";

export async function GET() {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      createdBy: { select: { username: true } },
      usedBy: { select: { username: true } },
    },
  });

  return NextResponse.json(
    invites.map((inv) => ({
      id: inv.id,
      code: inv.code,
      status: inv.status,
      maxUses: inv.maxUses,
      useCount: inv.useCount,
      expiresAt: inv.expiresAt?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
      createdByUsername: inv.createdBy.username,
      usedByUsername: inv.usedBy?.username ?? null,
    }))
  );
}

const createBodySchema = inviteCreateSchema.extend({
  code: z.string().min(4).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const body = await req.json();
  const result = createBodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const code =
    result.data.code?.toUpperCase() ||
    crypto.randomBytes(4).toString("hex").toUpperCase();

  const existing = await prisma.invite.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Invite code already exists" }, { status: 400 });
  }

  const expiresAt = result.data.expiresDays
    ? new Date(Date.now() + result.data.expiresDays * 24 * 60 * 60 * 1000)
    : null;

  const invite = await prisma.invite.create({
    data: {
      code,
      createdById: auth.user!.id,
      maxUses: result.data.maxUses,
      expiresAt,
    },
  });

  return NextResponse.json(
    {
      id: invite.id,
      code: invite.code,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
    },
    { status: 201 }
  );
}
