import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/admin";

export async function GET() {
  const auth = await requireModerator();
  if (auth.error) return auth.error;

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, username: true, email: true } },
    },
  });

  return NextResponse.json(
    reports.map((r) => ({
      id: r.id,
      reporterId: r.reporterId,
      reporterUsername: r.reporter.username,
      targetType: r.targetType,
      reportedUserId: r.reportedUserId,
      reportedPostId: r.reportedPostId,
      reportedCommentId: r.reportedCommentId,
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}
