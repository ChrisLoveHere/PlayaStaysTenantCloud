import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { getDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/db/schema";
import {
  isIndexablePath,
  isSeoPublicPath,
  NOINDEX_HEADER,
} from "@/lib/seo/robots";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string) {
  return (
    isSeoPublicPath(pathname) ||
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/register/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron")
  );
}

function withRobotsTag(response: NextResponse, pathname: string) {
  if (!isIndexablePath(pathname)) {
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
  }
  return response;
}

export default NextAuth(authConfig).auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const isPublic = isPublicPath(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute && isLoggedIn) {
    const role = req.auth?.user?.role as UserRole;
    return withRobotsTag(
      NextResponse.redirect(new URL(getDashboardPath(role), nextUrl)),
      pathname
    );
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withRobotsTag(NextResponse.redirect(loginUrl), pathname);
  }

  if (isLoggedIn) {
    const role = req.auth?.user?.role as UserRole;

    if (pathname.startsWith("/landlord") && role !== "landlord") {
      return withRobotsTag(
        NextResponse.redirect(new URL(getDashboardPath(role), nextUrl)),
        pathname
      );
    }
    if (pathname.startsWith("/agent") && role !== "agent") {
      return withRobotsTag(
        NextResponse.redirect(new URL(getDashboardPath(role), nextUrl)),
        pathname
      );
    }
    if (pathname.startsWith("/portal") && !["tenant", "prospect"].includes(role)) {
      return withRobotsTag(
        NextResponse.redirect(new URL(getDashboardPath(role), nextUrl)),
        pathname
      );
    }
  }

  return withRobotsTag(NextResponse.next(), pathname);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
