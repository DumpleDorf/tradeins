"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/disclaimer";

type Reservation = {
  id: string;
  status: string;
  reservedAt: string;
  vehicle: { year: number; make: string; model: string; vin: string };
  partner: {
    name: string;
    email: string;
    partnerProfile: { companyName: string; contactName: string } | null;
  };
};

export default function TeslaReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function load() {
    fetch("/api/reservations").then((r) => r.json()).then(setReservations);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    const body: { action: string; reason?: string } = { action };
    if (action === "reject") body.reason = reason;

    await fetch(`/api/reservations/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setRejectingId(null);
    setReason("");
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/tesla" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Reservations</h1>

        <div className="mt-8 space-y-4">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-sm border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                    </h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">VIN: {r.vehicle.vin}</p>
                  <p className="mt-2 text-sm">
                    {r.partner.partnerProfile?.companyName} — {r.partner.partnerProfile?.contactName} (
                    {r.partner.email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reserved {new Date(r.reservedAt).toLocaleString("en-AU")}
                  </p>
                </div>

                {r.status === "PENDING_APPROVAL" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(r.id, "approve")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectingId(r.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              {rejectingId === r.id && (
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Rejection reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(r.id, "reject")}
                  >
                    Confirm Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
