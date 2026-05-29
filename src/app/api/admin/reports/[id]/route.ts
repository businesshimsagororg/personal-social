import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";

const patchSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  notes: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const result = patchSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: result.data.status,
      ...(result.data.notes !== undefined ? { notes: result.data.notes } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
  });
}
