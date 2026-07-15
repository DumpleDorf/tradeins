"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StatusBadge } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { formatVehiclePrice } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type ReservedVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  vin: string;
  licensePlateNumber: string;
  price: number;
  status: string;
  updatedAt: string;
  photoUrl: string | null;
  reservedAt: string | null;
  partner: {
    name: string;
    email: string;
    companyName: string | null;
    contactName: string | null;
  } | null;
};

type StatusFilter = "reserved" | "sold" | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "all", label: "Reserved & sold" },
];

export default function TeslaReservationsPage() {
  const [vehicles, setVehicles] = useState<ReservedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("reserved");
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tesla/reserved-vehicles?status=${statusFilter}`);
        const data = await res.json();
        setVehicles(Array.isArray(data) ? data : []);
      } catch {
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, [statusFilter]);

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tesla/reserved-vehicles?status=${statusFilter}`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkSold(vehicleId: string) {
    setActionId(vehicleId);
    setError("");

    const res = await fetch(`/api/vehicles/${vehicleId}/mark-sold`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to mark vehicle as sold");
      setActionId(null);
      return;
    }

    setActionId(null);
    await reload();
  }

  return (
    <PageShell>
      <LoadingOverlay
        show={loading || actionId !== null}
        label={actionId ? "Marking vehicle as sold..." : "Loading vehicles..."}
      />

      <PageHeader
        title="Reserved / Sold Vehicles"
        description="Vehicles reserved by wholesale partners — confirm sales by marking sold"
      />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={statusFilter === value ? "default" : "outline"}
            className={cn(
              statusFilter !== value && "border-border/80 bg-card/80 backdrop-blur-sm"
            )}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {!loading && vehicles.length === 0 ? (
          <p className="text-muted-foreground">No vehicles match this view.</p>
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="animate-stagger-in rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:border-tesla-red/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <StatusBadge status={vehicle.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{vehicle.trim}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    VIN: {vehicle.vin} · Plate {vehicle.licensePlateNumber} ·{" "}
                    {formatVehiclePrice(vehicle.price)}
                  </p>
                  {vehicle.partner && (
                    <p className="mt-2 text-sm">
                      {vehicle.partner.companyName ?? vehicle.partner.name}
                      {vehicle.partner.contactName ? ` — ${vehicle.partner.contactName}` : ""} (
                      {vehicle.partner.email})
                    </p>
                  )}
                  {vehicle.reservedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reserved {new Date(vehicle.reservedAt).toLocaleString("en-AU")}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/tesla/listings/${vehicle.id}`}>
                    <Button size="sm" variant="outline">
                      View listing
                    </Button>
                  </Link>
                  {vehicle.status === "RESERVED" && (
                    <Button
                      size="sm"
                      disabled={actionId !== null}
                      onClick={() => handleMarkSold(vehicle.id)}
                    >
                      {actionId === vehicle.id ? "Marking sold..." : "Mark as sold"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
