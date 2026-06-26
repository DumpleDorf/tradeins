import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login/partner",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const loginType = credentials?.loginType as "tesla" | "partner" | undefined;

        if (!email || !password || !loginType) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { partnerProfile: true },
        });

        if (!user || user.status !== UserStatus.ACTIVE) return null;

        const isPartnerLogin = loginType === "partner";
        const isTeslaLogin = loginType === "tesla";

        if (isPartnerLogin && user.role !== UserRole.PARTNER) return null;
        if (
          isTeslaLogin &&
          user.role !== UserRole.TESLA_EMPLOYEE &&
          user.role !== UserRole.SUPER_ADMIN
        ) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
