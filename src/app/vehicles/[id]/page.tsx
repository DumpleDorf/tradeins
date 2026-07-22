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

type VehicleReservation = {
  id: string;
  status: string;
  partnerId?: string;
  partner?: { id: string };
};

type Vehicle = VehicleDetails & {
  id: string;
  status?: string;
  photos: { url: string }[];
  reservations?: VehicleReservation[];
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromReservations = searchParams.get("from") === "reservations";
  const listingsHref = resolveBrowseReturn(
    searchParams.get("from"),
    fromReservations ? "/reservations" : "/inventory"
  );
  const backLabel = fromReservations ? "Back to my reservations" : "Back to inventory";
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
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

  const ownActiveReservation = vehicle?.reservations?.find(
    (r) => r.status === "APPROVED" && (vehicle.status === "RESERVED" || vehicle.status === "SOLD")
  );
  const canReserve = vehicle?.status === "AVAILABLE";
  const canRelease = vehicle?.status === "RESERVED" && !!ownActiveReservation;
  const isSold = vehicle?.status === "SOLD" && !!ownActiveReservation;

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

  async function handleRelease() {
    if (!ownActiveReservation) return;
    setReleasing(true);
    setError("");

    const res = await fetch(`/api/reservations/${ownActiveReservation.id}/cancel`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to release reservation");
      setReleasing(false);
      return;
    }

    router.push("/reservations");
    router.refresh();
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
          <BackLink href={listingsHref} label={backLabel} className="mt-4" />
        </main>
      </div>
    );
  }

  const busy = reserving || releasing;

  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <LoadingOverlay
        show={busy}
        label={releasing ? "Releasing reservation..." : "Submitting reservation..."}
      />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackLink href={fromReservations ? "/reservations" : listingsHref} label={backLabel} />

        <div className="mt-8 animate-slide-up">
          <VehicleDetailContent
            vehicle={vehicle}
            cta={
              canReserve ? (
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
                      onClick={() => setShowReserveDialog(true)}
                    >
                      Reserve this Vehicle
                    </Button>
                  </div>
                </div>
              ) : canRelease ? (
                <div className="rounded-sm border border-border/80 bg-card/90 p-4 backdrop-blur-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h2 className="font-semibold">Your reservation</h2>
                      <p className="text-sm text-muted-foreground">
                        This vehicle is reserved for your company. Tesla staff will confirm the sale,
                        or you can release it back to inventory.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full shrink-0 sm:w-auto sm:min-w-[12rem]"
                      onClick={() => {
                        setError("");
                        setShowReleaseDialog(true);
                      }}
                    >
                      Release reservation
                    </Button>
                  </div>
                </div>
              ) : isSold ? (
                <div className="rounded-sm border border-border/80 bg-card/90 p-4 backdrop-blur-sm sm:p-5">
                  <h2 className="font-semibold">Sold</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tesla staff have marked this vehicle sold under your reservation.
                  </p>
                </div>
              ) : null
            }
            sidebar={
              <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                <h2 className="mb-2 font-semibold">How reservations work</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {canRelease
                    ? "This listing is held for your company while Tesla staff confirm the sale."
                    : isSold
                      ? "This vehicle has been marked sold. Contact Tesla staff if you need further help."
                      : "Once reserved, this listing is held for your company. Add optional notes when you confirm so Tesla staff have any context they need."}
                </p>
              </div>
            }
          />
        </div>
      </main>

      {canReserve && (
        <div className="fixed inset-x-0 bottom-0 z-[150] border-t border-border/80 bg-card/95 p-3 backdrop-blur-md sm:hidden">
          <Button size="lg" className="w-full" onClick={() => setShowReserveDialog(true)}>
            Reserve this Vehicle
          </Button>
        </div>
      )}

      {canRelease && (
        <div className="fixed inset-x-0 bottom-0 z-[150] border-t border-border/80 bg-card/95 p-3 backdrop-blur-md sm:hidden">
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => {
              setError("");
              setShowReleaseDialog(true);
            }}
          >
            Release reservation
          </Button>
        </div>
      )}

      {showReserveDialog && (
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
              <Button className="flex-1" onClick={handleReserve} disabled={busy}>
                {reserving ? "Submitting..." : "Confirm reservation"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowReserveDialog(false);
                  setError("");
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReleaseDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-vehicle-dialog-title"
        >
          <div
            className={cn(
              "w-full max-w-md rounded-sm border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-slide-up"
            )}
          >
            <h2 id="release-vehicle-dialog-title" className="text-lg font-semibold">
              Release reservation?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This cancels your reservation and returns the vehicle to available inventory so other
              wholesalers can reserve it.
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={handleRelease} disabled={busy}>
                {releasing ? "Releasing..." : "Release reservation"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowReleaseDialog(false);
                  setError("");
                }}
                disabled={busy}
              >
                Keep reservation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
