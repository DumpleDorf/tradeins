"use client";

import { SessionProvider } from "next-auth/react";
import { PostLoginEntrance } from "@/components/post-login-entrance";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PostLoginEntrance />
    </SessionProvider>
  );
}
