"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Disclaimer } from "@/components/disclaimer";
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
  licensePlateNumber: string;
  photos: { url: string }[];
};

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    yearMin: "",
    yearMax: "",
    odometerMin: "",
    odometerMax: "",
    sort: "newest",
  });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort: filters.sort });
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "sort") params.set(key, value);
    });

    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles ?? []);
    setTotalPages(data.pagination?.totalPages ?? 1);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Available Inventory</h1>
            <p className="mt-1 text-muted-foreground">Browse certified trade-in vehicles</p>
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
                  value={filters[key as keyof typeof filters]}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Sort by</Label>
              <select
                className="flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm"
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="newest">Newest</option>
                <option value="odometer_asc">Odometer: Low to High</option>
                <option value="odometer_desc">Odometer: High to Low</option>
              </select>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setPage(1);
                fetchInventory();
              }}
            >
              Apply Filters
            </Button>
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-muted-foreground">Loading inventory...</p>
            ) : vehicles.length === 0 ? (
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
