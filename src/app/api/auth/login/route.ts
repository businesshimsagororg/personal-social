import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, loginUserSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { shouldSkipEmailVerification } from "@/lib/app-url";
import { isPrismaConnectionError, DATABASE_UNAVAILABLE_MESSAGE } from "@/lib/db-errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid username/email or password" }, { status: 400 });
    }

    const { usernameOrEmail, password } = result.data;

    // Search user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid username/email or password" }, { status: 401 });
    }

    // Verify password
    const isPasswordMatch = await comparePassword(password, user.passwordHash);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: "Invalid username/email or password" }, { status: 401 });
    }

    // Handle user states
    if (user.status === "BANNED") {
      return NextResponse.json({ error: "Your account has been banned from this community." }, { status: 403 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended temporarily." }, { status: 403 });
    }

    if (user.status === "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Your account is awaiting administrator approval. You will be notified once approved." },
        { status: 403 }
      );
    }

    if (!user.emailVerified && !shouldSkipEmailVerification()) {
      return NextResponse.json(
        { error: "Please verify your email address before logging in. Check your mailbox for the verification link." },
        { status: 403 }
      );
    }

    // Login and create secure session cookie
    await loginUserSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: DATABASE_UNAVAILABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
