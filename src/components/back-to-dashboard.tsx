"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { getDashboardPath } from "@/lib/rbac";
import { backNavClassName } from "@/components/back-link";
import { cn } from "@/lib/utils";

type BackToDashboardProps = {
  className?: string;
  label?: string;
};

export function BackToDashboard({ className, label = "Dashboard" }: BackToDashboardProps) {
  const { data: session } = useSession();
  const href = session?.user?.role ? getDashboardPath(session.user.role) : "/";

  return (
    <Link href={href} className={cn(backNavClassName, className)}>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
