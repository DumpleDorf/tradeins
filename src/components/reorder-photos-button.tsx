"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ReorderResult = {
  dryRun: boolean;
  vehiclesScanned: number;
  vehiclesTouched: number;
  photosUpdated: number;
  photosRecognized: number;
  photosUnknown: number;
  error?: string;
};

type ReorderPhotosButtonProps = {
  className?: string;
};

/** Temporary one-time control — remove after photo reorder is done. */
export function ReorderPhotosButton({ className }: ReorderPhotosButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReorderResult | null>(null);

  async function handleClick() {
    if (loading) return;
    const ok = window.confirm(
      "ONE-TIME: Reorder all listing photos by AMP label (FrontAngle → … → Damage_*). Continue?"
    );
    if (!ok) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tesla/reorder-photos", { method: "POST" });
      const json = (await res.json()) as ReorderResult;
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Reorder failed");
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" variant="outline" disabled={loading} onClick={() => void handleClick()}>
        {loading ? "Reordering photos…" : "ONE-TIME: Reorder all listing photos"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Temporary admin action. Rewrites photo sort order for every vehicle using AMP labels.
        Safe to re-run — only updates photos whose order changed. Remove this button after use.
      </p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {result ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Done — scanned {result.vehiclesScanned} vehicles, updated {result.photosUpdated} photos
          across {result.vehiclesTouched} vehicles ({result.photosRecognized} recognized labels,{" "}
          {result.photosUnknown} unknown).
        </p>
      ) : null}
    </div>
  );
}
