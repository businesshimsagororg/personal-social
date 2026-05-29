import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getPasswordResetTemplate } from "@/lib/email";
import crypto from "crypto";
import { forgotPasswordSchema } from "@/lib/validations";
import { getAppUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Security practice: Don't reveal if user doesn't exist, just return success!
    if (!user) {
      return NextResponse.json({
        message: "If this email is registered, you will receive a password reset link shortly.",
      });
    }

    const passwordResetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    const resetUrl = `${getAppUrl()}/reset-password?token=${passwordResetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: getPasswordResetTemplate(user.username, resetUrl),
    });

    return NextResponse.json({
      message: "If this email is registered, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
