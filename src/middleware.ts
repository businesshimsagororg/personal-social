import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-random-key-32-chars-at-least-1234-abcd"
);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth-token")?.value;

  // Let public files, assets, api routes (except auth/session checks or data routes) pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("favicon.ico") ||
    pathname.startsWith("/uploads/")
  ) {
    return NextResponse.next();
  }

  let userPayload: { userId: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userPayload = payload as { userId: string; email: string; role: string };
    } catch (e) {
      // Token is invalid/expired
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // Authentication routes (login, signup, forgot password, verify-email)
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  if (isAuthRoute) {
    if (userPayload) {
      // User is already logged in, redirect to feed
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected routes
  if (!userPayload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (userPayload.role !== "ADMIN" && userPayload.role !== "MODERATOR") {
      // Redirect unauthorized users to feed
      return NextResponse.redirect(new URL("/feed", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, except custom protected endpoints which we handle inside routing files if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
