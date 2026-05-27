import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-random-key-32-chars-at-least-1234-abcd"
);

// Hashing passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Operations
export async function generateToken(payload: { userId: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 days expiration
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

// Session helpers for standard routes
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Fetch user and profile from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.status === "BANNED" || user.status === "SUSPENDED") {
      return null;
    }

    return user;
  } catch (e) {
    return null;
  }
}

// Login and Logout Helpers (to set and delete cookies)
export async function loginUserSession(payload: { userId: string; email: string; role: string }) {
  const token = await generateToken(payload);
  const cookieStore = await cookies();

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function logoutUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}
