import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/inventory/:path*",
    "/reservations/:path*",
    "/tesla/:path*",
    "/admin/:path*",
    "/vehicles/:path*",
  ],
};
