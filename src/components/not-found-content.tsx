"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getDashboardPath } from "@/lib/rbac";

export function NotFoundContent() {
  const { data: session } = useSession();
  const homeHref = session?.user ? getDashboardPath(session.user.role) : "/";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-6xl font-semibold tracking-tight">404</h1>
      <p className="mt-4 text-muted-foreground">This page could not be found.</p>
      <Link href={homeHref} className="mt-8">
        <Button>Return to homepage</Button>
      </Link>
    </div>
  );
}
