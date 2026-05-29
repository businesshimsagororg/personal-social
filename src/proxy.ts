import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { checkRateLimit } from "@/lib/rate-limit";
import { withSecurityHeaders } from "@/lib/security-headers";
import { getJwtSecret } from "@/lib/jwt-secret";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth-token")?.value;

  // API routes: rate limit + security headers; auth enforced per-route
  if (pathname.startsWith("/api/")) {
    const limited = await checkRateLimit(req, {
      prefix: pathname.startsWith("/api/auth") ? "auth" : "api",
      limit: pathname.startsWith("/api/auth") ? 20 : 120,
    });
    if (limited) return withSecurityHeaders(limited);
    return withSecurityHeaders(NextResponse.next());
  }

  // Static assets and uploads
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico") ||
    pathname.startsWith("/uploads/")
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  let userPayload: { userId: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      userPayload = payload as { userId: string; email: string; role: string };
    } catch (e) {
      // Token is invalid/expired
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth-token");
      return withSecurityHeaders(response);
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
      return withSecurityHeaders(NextResponse.redirect(new URL("/feed", req.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // If user is not logged in and trying to access protected routes
  if (!userPayload) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (userPayload.role !== "ADMIN" && userPayload.role !== "MODERATOR") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/feed", req.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
