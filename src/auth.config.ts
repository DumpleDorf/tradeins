import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/?signin=1",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
        return true;
      }

      if (!isLoggedIn) return false;

      const role = auth.user.role;

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
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.displayName = user.displayName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.displayName = token.displayName;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
