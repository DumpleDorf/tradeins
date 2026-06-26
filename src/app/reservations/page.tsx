"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Disclaimer } from "@/components/disclaimer";
import { StatusBadge } from "@/components/disclaimer";

type Reservation = {
  id: string;
  status: string;
  reservedAt: string;
  rejectionReason?: string;
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    licensePlateNumber: string;
    photos: { url: string }[];
  };
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations")
      .then((res) => res.json())
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">My Reservations</h1>
          <Link href="/inventory" className="text-sm text-tesla-red hover:underline">
            Browse inventory
          </Link>
        </div>

        <Disclaimer />

        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : reservations.length === 0 ? (
            <p className="text-muted-foreground">You have no reservations yet.</p>
          ) : (
            reservations.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">
                      {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                    </h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    VIN: {r.vehicle.vin} · Plate {r.vehicle.licensePlateNumber} · Reserved{" "}
                    {new Date(r.reservedAt).toLocaleString("en-AU")}
                  </p>
                  {r.rejectionReason && (
                    <p className="mt-2 text-sm text-red-400">Reason: {r.rejectionReason}</p>
                  )}
                </div>
                <Link
                  href={`/reservations/${r.id}`}
                  className="text-sm text-tesla-red hover:underline"
                >
                  View details
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
