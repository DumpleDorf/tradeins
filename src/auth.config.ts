import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    // Path only — query strings here get encoded into the pathname by Auth.js
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Role and auth redirects are handled in middleware.ts
    authorized() {
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
