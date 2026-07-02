"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  price: number;
  licensePlateNumber: string;
  photos: { url: string }[];
};

const emptyFilters = {
  make: "",
  model: "",
  yearMin: "",
  yearMax: "",
  odometerMin: "",
  odometerMax: "",
  sort: "newest",
};

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort: appliedFilters.sort });
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value && key !== "sort") params.set(key, value);
    });

    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles ?? []);
    setTotalPages(data.pagination?.totalPages ?? 1);
    setLoading(false);
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  function applyFilters() {
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-background">
      <LoadingOverlay show={loading} label="Loading inventory..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Available Inventory</h1>
            <p className="mt-1 text-muted-foreground">Browse trade-in vehicles</p>
          </div>
          <Link href="/reservations">
            <Button variant="outline">My Reservations</Button>
          </Link>
        </div>

        <Disclaimer />

        <div className="mt-8 grid gap-8 lg:grid-cols-4">
          <aside className="space-y-4 rounded-sm border border-border bg-card p-4 lg:col-span-1">
            <h2 className="font-semibold">Filters</h2>
            {[
              ["make", "Make"],
              ["model", "Model"],
              ["yearMin", "Year from"],
              ["yearMax", "Year to"],
              ["odometerMin", "Odometer from"],
              ["odometerMax", "Odometer to"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  value={draftFilters[key as keyof typeof draftFilters]}
                  onChange={(e) =>
                    setDraftFilters((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Sort by</Label>
              <select
                className="flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm"
                value={draftFilters.sort}
                onChange={(e) => setDraftFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="newest">Newest</option>
                <option value="odometer_asc">Odometer: Low to High</option>
                <option value="odometer_desc">Odometer: High to Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={applyFilters}>
                Apply Filters
              </Button>
              <Button className="flex-1" variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {loading ? null : vehicles.length === 0 ? (
              <p className="text-muted-foreground">No vehicles match your filters.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    href={`/vehicles/${vehicle.id}`}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
