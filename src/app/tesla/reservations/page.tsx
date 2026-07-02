"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
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
  const [loading, setLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const hasActiveFilters = statusFilter !== "ALL" || companySearch.trim().length > 0;

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (companySearch.trim() && !matchesCompanySearch(r, companySearch)) return false;
    return true;
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/reservations");
    const data = await res.json();
    setReservations(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    if (action === "reject" && !reason.trim()) {
      setError("Please enter a rejection reason");
      return;
    }

    setError("");
    setActionId(id);
    setActionType(action);

    const body: { action: string; reason?: string } = { action };
    if (action === "reject") body.reason = reason;

    const res = await fetch(`/api/reservations/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Action failed");
      setActionId(null);
      setActionType(null);
      return;
    }

    setRejectingId(null);
    setReason("");
    setActionId(null);
    setActionType(null);
    await load();
  }

  const actionLabel =
    actionType === "approve" ? "Approving reservation..." : "Rejecting reservation...";

  return (
    <PageShell>
      <LoadingOverlay show={loading || actionId !== null} label={actionId ? actionLabel : "Loading reservations..."} />

      <PageHeader title="Reservations" />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

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
          {!loading && filteredReservations.length === 0 ? (
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No reservations match your filters."
                : "No reservations yet."}
            </p>
          ) : (
            filteredReservations.map((r) => (
              <div key={r.id} className="animate-stagger-in rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:border-tesla-red/30">
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
                        <Button
                          size="sm"
                          disabled={actionId !== null}
                          onClick={() => handleAction(r.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionId !== null}
                          onClick={() => {
                            setRejectingId(r.id);
                            setError("");
                          }}
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
                      disabled={actionId !== null}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionId !== null || !reason.trim()}
                      onClick={() => handleAction(r.id, "reject")}
                    >
                      {actionId === r.id && actionType === "reject" ? "Rejecting..." : "Confirm Reject"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionId !== null}
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                        setError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
    </PageShell>
  );
}
