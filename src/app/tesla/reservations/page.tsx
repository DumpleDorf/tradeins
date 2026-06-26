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
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    licensePlateNumber: string;
  };
  partner: {
    name: string;
    email: string;
    partnerProfile: { companyName: string; contactName: string } | null;
  };
};

type StatusFilter = "ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function matchesCompanySearch(reservation: Reservation, query: string) {
  const company = reservation.partner.partnerProfile?.companyName ?? "";
  return company.toLowerCase().includes(query.trim().toLowerCase());
}

export default function TeslaReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const hasActiveFilters = statusFilter !== "ALL" || companySearch.trim().length > 0;

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (companySearch.trim() && !matchesCompanySearch(r, companySearch)) return false;
    return true;
  });

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

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md flex-1">
            <Input
              type="search"
              placeholder="Search by company name..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              aria-label="Filter reservations by company name"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={statusFilter === value ? "default" : "outline"}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {filteredReservations.length} of {reservations.length} reservations
          </p>
        )}

        <div className="mt-8 space-y-4">
          {filteredReservations.length === 0 ? (
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No reservations match your filters."
                : "No reservations yet."}
            </p>
          ) : (
            filteredReservations.map((r) => (
              <div key={r.id} className="rounded-sm border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                      </h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      VIN: {r.vehicle.vin} · Plate {r.vehicle.licensePlateNumber}
                    </p>
                    <p className="mt-2 text-sm">
                      {r.partner.partnerProfile?.companyName} — {r.partner.partnerProfile?.contactName} (
                      {r.partner.email})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reserved {new Date(r.reservedAt).toLocaleString("en-AU")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/tesla/listings/${r.vehicle.id}`}>
                      <Button size="sm" variant="outline">
                        View listing
                      </Button>
                    </Link>
                    {r.status === "PENDING_APPROVAL" && (
                      <>
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
                      </>
                    )}
                  </div>
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
            ))
          )}
        </div>
      </main>
    </div>
  );
}
