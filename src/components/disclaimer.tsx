import { cn } from "@/lib/utils";
import { formatUserRoleLabel } from "@/lib/audit-display";
import { DISCLAIMER, LISTING_DISCLAIMER } from "@/lib/utils";

export function Disclaimer({ variant = "partner" }: { variant?: "partner" | "listing" | "hero" }) {
  if (variant === "hero") {
    return (
      <div className="hero-text-shadow rounded-sm border border-white/20 bg-black/40 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
        {DISCLAIMER}
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-tesla-red/30 bg-tesla-red/5 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
      {variant === "listing" ? LISTING_DISCLAIMER : DISCLAIMER}
    </div>
  );
}

const ROLE_STATUSES = new Set(["PARTNER", "TESLA_EMPLOYEE", "SUPER_ADMIN"]);

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-green-500/20 text-green-400",
    RESERVED: "bg-yellow-500/20 text-yellow-400",
    PENDING_APPROVAL: "bg-orange-500/20 text-orange-400",
    SOLD: "bg-blue-500/20 text-blue-400",
    REJECTED: "bg-red-500/20 text-red-400",
    APPROVED: "bg-green-500/20 text-green-400",
    PENDING: "bg-orange-500/20 text-orange-400",
    ACTIVE: "bg-green-500/20 text-green-400",
    INACTIVE: "bg-red-500/20 text-red-400",
    PARTNER: "bg-muted text-muted-foreground",
    TESLA_EMPLOYEE: "bg-muted text-muted-foreground",
    SUPER_ADMIN: "bg-muted text-muted-foreground",
  };

  const label = ROLE_STATUSES.has(status)
    ? formatUserRoleLabel(status)
    : status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
