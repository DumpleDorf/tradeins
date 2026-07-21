"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Red count badge for pending RESERVED vehicles. Hidden when count is 0. */
export function ReservationRequestsBadge({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tesla/dashboard-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.reservationRequests === "number") {
          setCount(data.reservationRequests);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!count || count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tesla-red px-1.5 text-[11px] font-semibold leading-none text-white",
        className
      )}
      aria-label={`${count} reservation request${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
