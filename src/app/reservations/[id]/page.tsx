"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleDetailContent } from "@/components/vehicle-detail-content";
import { Button } from "@/components/ui/button";
import { type VehicleDetails } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type ReservationDetail = {
  id: string;
  status: string;
  reservedAt: string;
  notes?: string | null;
  rejectionReason?: string | null;
  vehicle: VehicleDetails & {
    id: string;
    status: string;
    photos: { url: string }[];
  };
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReservation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleRelease() {
    setReleasing(true);
    setError("");

    const res = await fetch(`/api/reservations/${id}/cancel`, { method: "POST" });
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
        <Header />
        <LoadingOverlay show label="Loading reservation..." />
      </div>
    );
  }

  if (!reservation?.id || !reservation.vehicle?.id) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p>Reservation not found.</p>
          <BackLink href="/reservations" label="Back to my reservations" className="mt-4" />
        </main>
      </div>
    );
  }

  const { vehicle } = reservation;
  const canRelease =
    reservation.status === "APPROVED" && vehicle.status === "RESERVED";
  const isCancelled = reservation.status === "CANCELLED";

  return (
    <div className="min-h-screen">
      <LoadingOverlay show={releasing} label="Releasing reservation..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackLink href="/reservations" label="Back to my reservations" />

        {reservation.notes && (
          <p className="mt-4 rounded-sm border border-border/60 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
            Your notes: {reservation.notes}
          </p>
        )}

        <div className="mt-8 animate-slide-up">
          <VehicleDetailContent
            vehicle={vehicle}
            statusBadge={isCancelled ? "CANCELLED" : vehicle.status}
            subtitle={`Reserved ${new Date(reservation.reservedAt).toLocaleString("en-AU")}`}
            sidebar={
              <div className="space-y-4">
                <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                  <h2 className="mb-2 font-semibold">Reservation status</h2>
                  <p className="text-sm text-muted-foreground">
                    {isCancelled
                      ? "This reservation was released. The vehicle is back in inventory for wholesalers."
                      : vehicle.status === "SOLD"
                        ? "Tesla staff have marked this vehicle sold."
                        : "This reservation marks your intention to buy. The vehicle is hidden from other wholesalers while Tesla staff confirm the sale."}
                  </p>
                </div>

                {canRelease && (
                  <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                    <h2 className="mb-2 font-semibold">Release reservation</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Cancel your reservation and return this vehicle to available inventory.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setError("");
                        setShowDialog(true);
                      }}
                    >
                      Release reservation
                    </Button>
                  </div>
                )}
              </div>
            }
          />
        </div>
      </main>

      {showDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-dialog-title"
        >
          <div
            className={cn(
              "w-full max-w-md rounded-sm border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-slide-up"
            )}
          >
            <h2 id="release-dialog-title" className="text-lg font-semibold">
              Release reservation?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This cancels your reservation and returns the vehicle to available inventory so other
              wholesalers can reserve it.
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={handleRelease} disabled={releasing}>
                {releasing ? "Releasing..." : "Release reservation"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setError("");
                }}
                disabled={releasing}
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
