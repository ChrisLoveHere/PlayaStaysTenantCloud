import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/db/schema";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/auth")
  );
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute && isLoggedIn) {
    const role = req.auth?.user?.role as UserRole;
    return NextResponse.redirect(new URL(getDashboardPath(role), nextUrl));
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn) {
    const role = req.auth?.user?.role as UserRole;

    if (pathname.startsWith("/landlord") && role !== "landlord") {
      return NextResponse.redirect(new URL(getDashboardPath(role), nextUrl));
    }
    if (pathname.startsWith("/agent") && role !== "agent") {
      return NextResponse.redirect(new URL(getDashboardPath(role), nextUrl));
    }
    if (pathname.startsWith("/portal") && !["tenant", "prospect"].includes(role)) {
      return NextResponse.redirect(new URL(getDashboardPath(role), nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
