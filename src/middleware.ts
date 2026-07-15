import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/reservations") ||
    pathname.startsWith("/tesla") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vehicles")
  );
}

function hasPathAccess(pathname: string, role: string | undefined) {
  if (pathname.startsWith("/admin")) {
    return role === "SUPER_ADMIN";
  }
  if (pathname.startsWith("/tesla")) {
    return role === "TESLA_EMPLOYEE" || role === "SUPER_ADMIN";
  }
  if (
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/reservations") ||
    pathname.startsWith("/vehicles")
  ) {
    return role === "PARTNER";
  }
  return true;
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasPathAccess(pathname, role)) {
    return NextResponse.rewrite(new URL("/not-found", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/inventory/:path*",
    "/reservations/:path*",
    "/tesla/:path*",
    "/admin/:path*",
    "/vehicles/:path*",
  ],
};
