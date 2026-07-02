import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const backNavClassName =
  "inline-flex items-center gap-1 rounded-sm border border-border/60 bg-card/40 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-tesla-red/40 hover:bg-card/70 hover:text-foreground";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link href={href} className={cn(backNavClassName, className)}>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
