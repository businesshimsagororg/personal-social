import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    // Set emailVerified to true and clear verification token details.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFICATION_SUCCESS",
      },
    });

    return NextResponse.json({
      message: "Email address verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
