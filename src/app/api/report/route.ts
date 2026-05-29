import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { reportCreateSchema } from "@/lib/validations";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = reportCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid report", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { targetType, targetId, reason } = result.data;
  const safeReason = sanitizeText(reason);

  const data: {
    reporterId: string;
    targetType: typeof targetType;
    reason: string;
    reportedUserId?: string;
    reportedPostId?: string;
    reportedCommentId?: string;
  } = {
    reporterId: user.id,
    targetType,
    reason: safeReason,
  };

  if (targetType === "USER") {
    if (targetId === user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    data.reportedUserId = targetId;
  } else if (targetType === "POST") {
    const target = await prisma.post.findUnique({ where: { id: targetId } });
    if (!target) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    data.reportedPostId = targetId;
  } else {
    const target = await prisma.comment.findUnique({ where: { id: targetId } });
    if (!target) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    data.reportedCommentId = targetId;
  }

  const report = await prisma.report.create({ data });

  return NextResponse.json(
    { message: "Report submitted", id: report.id },
    { status: 201 }
  );
}
