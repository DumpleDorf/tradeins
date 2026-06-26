export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/inventory/:path*",
    "/reservations/:path*",
    "/tesla/:path*",
    "/admin/:path*",
    "/vehicles/:path*",
  ],
};
