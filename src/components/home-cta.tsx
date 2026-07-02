"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getDashboardPath } from "@/lib/rbac";

export function HomeCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="mt-10 flex items-center justify-center">
        <p className="text-sm text-white/70 hero-text-shadow">Loading...</p>
      </div>
    );
  }

  if (session?.user) {
    const dashboardPath = getDashboardPath(session.user.role);

    return (
      <div className="mt-10 flex items-center justify-center gap-3">
        <Link href={dashboardPath}>
          <Button size="lg" className="min-w-[200px]">
            Go to Dashboard
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="min-w-[140px] border-white/40 bg-black/30 text-white hover:bg-black/50 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 flex items-center justify-center">
      <Link href="/login">
        <Button size="lg" className="min-w-[200px]">
          Sign In
        </Button>
      </Link>
    </div>
  );
}
