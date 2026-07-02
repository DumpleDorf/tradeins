"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Disclaimer, StatusBadge } from "@/components/disclaimer";
import { PhotoGallery } from "@/components/photo-gallery";
import { getVehicleDetailRows, formatVehiclePrice, type VehicleDetails } from "@/lib/vehicle";

type ReservationDetail = {
  id: string;
  status: string;
  reservedAt: string;
  rejectionReason?: string | null;
  vehicle: VehicleDetails & {
    id: string;
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
      });
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
        <main className="mx-auto max-w-7xl px-4 py-16">
          <p>Reservation not found.</p>
          <Link href="/reservations" className="text-tesla-red hover:underline">
            Back to my reservations
          </Link>
        </main>
      </div>
    );
  }

  const { vehicle } = reservation;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/reservations" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to my reservations
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <StatusBadge status={reservation.status} />
        </div>
        {vehicle.price > 0 && (
          <p className="mt-2 text-2xl font-semibold">{formatVehiclePrice(vehicle.price)}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Reserved {new Date(reservation.reservedAt).toLocaleString("en-AU")}
        </p>

        <Disclaimer />

        {reservation.rejectionReason && (
          <p className="mt-4 rounded-sm border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Rejection reason: {reservation.rejectionReason}
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <PhotoGallery photos={vehicle.photos} />

          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {getVehicleDetailRows(vehicle).map(([label, value]) => (
                <div key={label} className={label === "Trim" ? "col-span-2" : undefined}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h2 className="mb-2 font-semibold">Vehicle Notes</h2>
              <p className="text-muted-foreground">{vehicle.vehicleNotes}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              This vehicle is reserved and hidden from partner inventory while your request is
              reviewed by Tesla.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
