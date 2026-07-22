"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StatusBadge } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Reservation = {
  id: string;
  status: string;
  reservedAt: string;
  notes?: string | null;
  rejectionReason?: string;
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    licensePlateNumber: string;
    status: string;
    photos: { url: string }[];
  };
};

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function loadReservations() {
    return fetch("/api/reservations")
      .then((res) => res.json())
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function handleRelease(id: string) {
    setReleasingId(id);
    setError("");

    const res = await fetch(`/api/reservations/${id}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to release reservation");
      setReleasingId(null);
      return;
    }

    setConfirmId(null);
    setReleasingId(null);
    await loadReservations();
    router.refresh();
  }

  const confirmReservation = confirmId
    ? reservations.find((r) => r.id === confirmId)
    : null;

  return (
    <div className="min-h-screen">
      <LoadingOverlay
        show={loading || !!releasingId}
        label={releasingId ? "Releasing reservation..." : "Loading reservations..."}
      />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">My Reservations</h1>
            <p className="mt-1 text-muted-foreground">
              Vehicles you have marked as an intention to buy. Tesla staff confirm sales by
              marking them sold.
            </p>
          </div>
          <Link href="/inventory">
            <Button variant="outline" className="border-border/80 bg-card/80 backdrop-blur-sm">
              Browse inventory
            </Button>
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {!loading && reservations.length === 0 ? (
            <div className="rounded-sm border border-border/80 bg-card/80 p-10 text-center backdrop-blur-sm">
              <p className="text-muted-foreground">You have not reserved any vehicles yet.</p>
            </div>
          ) : (
            reservations.map((r) => {
              const canRelease = r.status === "APPROVED" && r.vehicle.status === "RESERVED";
              const badgeStatus =
                r.status === "CANCELLED" ? "CANCELLED" : r.vehicle.status;
              const vehicleHref = `/vehicles/${r.vehicle.id}?from=reservations`;

              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-4 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={vehicleHref}
                    className="min-w-0 flex-1 rounded-sm outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tesla-red"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold hover:underline">
                        {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                      </h3>
                      <StatusBadge status={badgeStatus} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      VIN: {r.vehicle.vin} · Plate {r.vehicle.licensePlateNumber} · Reserved{" "}
                      {new Date(r.reservedAt).toLocaleString("en-AU")}
                    </p>
                    {r.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">Notes: {r.notes}</p>
                    )}
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {canRelease && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError("");
                          setConfirmId(r.id);
                        }}
                      >
                        Release
                      </Button>
                    )}
                    <Link href={vehicleHref}>
                      <Button variant="outline" size="sm">
                        View details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {confirmReservation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-list-dialog-title"
        >
          <div
            className={cn(
              "w-full max-w-md rounded-sm border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-slide-up"
            )}
          >
            <h2 id="release-list-dialog-title" className="text-lg font-semibold">
              Release reservation?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Cancel your reservation on{" "}
              <span className="text-foreground">
                {confirmReservation.vehicle.year} {confirmReservation.vehicle.make}{" "}
                {confirmReservation.vehicle.model}
              </span>{" "}
              and return it to available inventory.
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                onClick={() => handleRelease(confirmReservation.id)}
                disabled={!!releasingId}
              >
                {releasingId ? "Releasing..." : "Release reservation"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setConfirmId(null);
                  setError("");
                }}
                disabled={!!releasingId}
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
