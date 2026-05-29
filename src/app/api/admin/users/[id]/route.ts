import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";

const patchSchema = z.object({
  status: z.enum(["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "BANNED"]).optional(),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const result = patchSchema.safeParse(body);
  if (!result.success || (!result.data.status && !result.data.role)) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  if (result.data.role === "ADMIN" && auth.user!.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can assign admin role" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(result.data.status ? { status: result.data.status } : {}),
      ...(result.data.role ? { role: result.data.role } : {}),
    },
    include: { profile: { select: { displayName: true, avatarUrl: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.user!.id,
      action: "ADMIN_UPDATE_USER",
      metadata: JSON.stringify({ targetUserId: id, ...result.data }),
    },
  });

  return NextResponse.json({
    id: updated.id,
    username: updated.username,
    status: updated.status,
    role: updated.role,
  });
}
