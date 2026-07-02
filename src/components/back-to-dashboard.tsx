"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { getDashboardPath } from "@/lib/rbac";

export function BackToDashboard() {
  const { data: session } = useSession();
  const href = session?.user?.role ? getDashboardPath(session.user.role) : "/";

  return (
    <Link href={href} className="text-sm text-muted-foreground hover:text-tesla-red">
      ← Back to dashboard
    </Link>
  );
}
