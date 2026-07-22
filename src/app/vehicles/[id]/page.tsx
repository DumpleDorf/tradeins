"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleDetailContent } from "@/components/vehicle-detail-content";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resolveBrowseReturn } from "@/lib/browse-return";
import { type VehicleDetails } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type Vehicle = VehicleDetails & {
  id: string;
  photos: { url: string }[];
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingsHref = resolveBrowseReturn(searchParams.get("from"), "/inventory");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vehicles/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!cancelled) {
          setVehicle(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleReserve() {
    setReserving(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes.trim() || undefined }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to reserve vehicle");
      setReserving(false);
      return;
    }

    router.push("/reservations");
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingOverlay show label="Loading vehicle..." />
        <Header />
      </div>
    );
  }

  if (!vehicle?.id) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p>Vehicle not found.</p>
          <BackLink href={listingsHref} label="Back to inventory" className="mt-4" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <LoadingOverlay show={reserving} label="Submitting reservation..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackLink href={listingsHref} label="Back to inventory" />

        <div className="mt-8 animate-slide-up">
          <VehicleDetailContent
            vehicle={vehicle}
            cta={
              <div className="rounded-sm border border-tesla-red/40 bg-card/90 p-4 shadow-md shadow-tesla-red/10 backdrop-blur-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h2 className="font-semibold">Reserve this vehicle</h2>
                    <p className="text-sm text-muted-foreground">
                      Marks your intention to buy and hides it from other wholesalers. Tesla staff
                      will confirm the sale.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full shrink-0 sm:w-auto sm:min-w-[12rem]"
                    onClick={() => setShowDialog(true)}
                  >
                    Reserve this Vehicle
                  </Button>
                </div>
              </div>
            }
            sidebar={
              <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                <h2 className="mb-2 font-semibold">How reservations work</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Once reserved, this listing is held for your company. Add optional notes when you
                  confirm so Tesla staff have any context they need.
                </p>
              </div>
            }
          />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[150] border-t border-border/80 bg-card/95 p-3 backdrop-blur-md sm:hidden">
        <Button size="lg" className="w-full" onClick={() => setShowDialog(true)}>
          Reserve this Vehicle
        </Button>
      </div>

      {showDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-dialog-title"
        >
          <div
            className={cn(
              "w-full max-w-md rounded-sm border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-slide-up"
            )}
          >
            <h2 id="reserve-dialog-title" className="text-lg font-semibold">
              Confirm reservation
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This will reserve the vehicle under your company as an intention to buy and notify
              Tesla staff to confirm the sale.
            </p>
            <div className="mt-4 space-y-2">
              <Label htmlFor="reservation-notes">Reservation notes (optional)</Label>
              <textarea
                id="reservation-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any comments for Tesla staff..."
                className="flex w-full rounded-sm border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={handleReserve} disabled={reserving}>
                {reserving ? "Submitting..." : "Confirm reservation"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setError("");
                }}
                disabled={reserving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
