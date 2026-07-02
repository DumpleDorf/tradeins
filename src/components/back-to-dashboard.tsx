"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { getDashboardPath } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type BackToDashboardProps = {
  className?: string;
  label?: string;
};

export function BackToDashboard({ className, label = "Dashboard" }: BackToDashboardProps) {
  const { data: session } = useSession();
  const href = session?.user?.role ? getDashboardPath(session.user.role) : "/";

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-border/60 bg-card/40 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-all duration-200",
        "hover:border-tesla-red/40 hover:bg-card/70 hover:text-foreground",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
