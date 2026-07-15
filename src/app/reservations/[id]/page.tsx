"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleDetailContent } from "@/components/vehicle-detail-content";
import { type VehicleDetails } from "@/lib/vehicle";

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
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReservation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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

  return (
    <div className="min-h-screen">
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
            statusBadge={vehicle.status}
            subtitle={`Reserved ${new Date(reservation.reservedAt).toLocaleString("en-AU")}`}
            sidebar={
              <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                <h2 className="mb-2 font-semibold">Reservation status</h2>
                <p className="text-sm text-muted-foreground">
                  This reservation marks your intention to buy. The vehicle is hidden from other
                  wholesalers while Tesla staff confirm the sale (Available → Reserved → Sold).
                </p>
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}
