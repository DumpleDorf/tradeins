"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StatusBadge } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";

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
    status: string;
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
    <div className="min-h-screen">
      <LoadingOverlay show={loading} label="Loading purchases..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">My Purchases</h1>
            <p className="mt-1 text-muted-foreground">Vehicles reserved under your company</p>
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
              <p className="text-muted-foreground">You have not purchased any vehicles yet.</p>
            </div>
          ) : (
            reservations.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-4 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">
                      {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                    </h3>
                    <StatusBadge status={r.vehicle.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    VIN: {r.vehicle.vin} · Plate {r.vehicle.licensePlateNumber} · Purchased{" "}
                    {new Date(r.reservedAt).toLocaleString("en-AU")}
                  </p>
                  {r.rejectionReason && (
                    <p className="mt-2 text-sm text-red-400">Note: {r.rejectionReason}</p>
                  )}
                </div>
                <Link href={`/reservations/${r.id}`}>
                  <Button variant="outline" size="sm">
                    View details
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
