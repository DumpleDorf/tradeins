import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole, UserStatus } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

declare module "next-auth" {
  interface User {
    role: UserRole;
    displayName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      displayName: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    displayName: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.displayName = user.displayName;
      } else if (token.id && !token.displayName) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { partnerProfile: true },
        });
        if (dbUser) {
          token.displayName =
            dbUser.role === UserRole.PARTNER
              ? dbUser.partnerProfile?.companyName ?? dbUser.name
              : dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.displayName = token.displayName ?? session.user.name;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { partnerProfile: true },
        });

        if (!user || user.status !== UserStatus.ACTIVE) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        const displayName =
          user.role === UserRole.PARTNER
            ? user.partnerProfile?.companyName ?? user.name
            : user.name;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          displayName,
        };
      },
    }),
  ],
});
