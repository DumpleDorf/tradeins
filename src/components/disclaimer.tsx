import { cn } from "@/lib/utils";
import { DISCLAIMER, LISTING_DISCLAIMER } from "@/lib/utils";

export function Disclaimer({ variant = "partner" }: { variant?: "partner" | "listing" }) {
  return (
    <div className="rounded-sm border border-tesla-red/30 bg-tesla-red/5 px-4 py-3 text-sm text-muted-foreground">
      {variant === "listing" ? LISTING_DISCLAIMER : DISCLAIMER}
    </div>
  );
}

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
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
