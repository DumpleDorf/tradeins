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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (session?.user) {
    const dashboardPath = getDashboardPath(session.user.role);
    const displayName = session.user.displayName ?? session.user.name;

    return (
      <div className="mt-10 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{displayName}</span>
        </p>
        <div className="flex items-center gap-3">
          <Link href={dashboardPath}>
            <Button size="lg" className="min-w-[200px]">
              Go to Dashboard
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="min-w-[140px]"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </div>
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
