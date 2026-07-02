"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search } from "lucide-react";
import { Header } from "@/components/header";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleListItem } from "@/components/vehicle-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  countActiveInventoryFilters,
  createDefaultFilters,
  InventoryFiltersPanel,
  type InventoryFilterValues,
  type InventoryMeta,
} from "@/components/inventory/inventory-filters";
import { cn } from "@/lib/utils";

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

type SortOption =
  | "newest"
  | "oldest"
  | "year_desc"
  | "year_asc"
  | "odometer_asc"
  | "odometer_desc"
  | "price_asc"
  | "price_desc";

type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest listed" },
  { value: "oldest", label: "Oldest listed" },
  { value: "year_desc", label: "Year: New to old" },
  { value: "year_asc", label: "Year: Old to new" },
  { value: "odometer_asc", label: "Odometer: Low to high" },
  { value: "odometer_desc", label: "Odometer: High to low" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
];

const DEFAULT_META: InventoryMeta = {
  yearMin: new Date().getFullYear() - 10,
  yearMax: new Date().getFullYear(),
  odometerMin: 0,
  odometerMax: 200000,
  makes: [],
  modelOptions: [],
  serviceHistories: [],
};

function filtersToParams(
  filters: InventoryFilterValues,
  meta: InventoryMeta,
  sort: SortOption,
  search: string,
  page: number
) {
  const params = new URLSearchParams({ page: String(page), sort });
  if (search.trim()) params.set("search", search.trim());
  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.vehicleDamage) params.set("vehicleDamage", filters.vehicleDamage);
  if (filters.serviceHistory) params.set("serviceHistory", filters.serviceHistory);
  if (filters.yearRange[0] > meta.yearMin) params.set("yearMin", String(filters.yearRange[0]));
  if (filters.yearRange[1] < meta.yearMax) params.set("yearMax", String(filters.yearRange[1]));
  if (filters.odometerRange[0] > meta.odometerMin) {
    params.set("odometerMin", String(filters.odometerRange[0]));
  }
  if (filters.odometerRange[1] < meta.odometerMax) {
    params.set("odometerMax", String(filters.odometerRange[1]));
  }
  return params;
}

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<InventoryMeta>(DEFAULT_META);
  const [metaReady, setMetaReady] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftFilters, setDraftFilters] = useState<InventoryFilterValues>(
    createDefaultFilters(DEFAULT_META)
  );
  const [appliedFilters, setAppliedFilters] = useState<InventoryFilterValues>(
    createDefaultFilters(DEFAULT_META)
  );
  const metaRef = useRef(meta);
  metaRef.current = meta;

  useEffect(() => {
    const stored = window.localStorage.getItem("inventory-view-mode");
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("inventory-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const params = filtersToParams(appliedFilters, metaRef.current, sort, search, page);

    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles ?? []);
    setTotalPages(data.pagination?.totalPages ?? 1);
    setTotal(data.pagination?.total ?? 0);

    if (data.meta) {
      setMeta(data.meta);
      if (!metaReady) {
        const defaults = createDefaultFilters(data.meta);
        setDraftFilters(defaults);
        setAppliedFilters(defaults);
        setMetaReady(true);
      }
    }

    setLoading(false);
  }, [appliedFilters, sort, search, page, metaReady]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [filtersOpen, appliedFilters]);

  const activeFilterCount = useMemo(
    () => countActiveInventoryFilters(appliedFilters, meta),
    [appliedFilters, meta]
  );

  function applyFilters() {
    setPage(1);
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }

  function clearFilters() {
    const defaults = createDefaultFilters(meta);
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
    setFiltersOpen(false);
  }

  return (
    <div className="min-h-screen">
      <LoadingOverlay show={loading} label="Loading inventory..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-slide-up space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Available Inventory</h1>
            <p className="text-muted-foreground">Browse trade-in vehicles</p>
          </div>
          <Link href="/reservations" className="animate-slide-up shrink-0">
            <Button variant="outline" className="border-border/80 bg-card/80 backdrop-blur-sm">
              My Reservations
            </Button>
          </Link>
        </div>

        <Disclaimer />

        <div className="mt-8 space-y-4">
          <div className="relative animate-slide-up">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by make, model, trim, rego, or year..."
              className="h-11 border-border/80 bg-card/80 pl-10 backdrop-blur-sm"
              aria-label="Search inventory"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Searching..." : `${total} vehicle${total === 1 ? "" : "s"} found`}
              {activeFilterCount > 0 && (
                <span className="ml-2 text-tesla-red">
                  · {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <InventoryFiltersPanel
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                draft={draftFilters}
                onDraftChange={setDraftFilters}
                meta={meta}
                activeCount={activeFilterCount}
                onApply={applyFilters}
                onClear={clearFilters}
              />

              <div className="flex items-center gap-2">
                <label htmlFor="inventory-sort" className="sr-only">
                  Sort by
                </label>
                <select
                  id="inventory-sort"
                  className="h-10 rounded-sm border border-border/80 bg-card/80 px-3 text-sm backdrop-blur-sm"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortOption);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex rounded-sm border border-border/80 bg-card/80 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-sm p-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-tesla-red text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-sm p-2 transition-colors",
                    viewMode === "list"
                      ? "bg-tesla-red text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {!loading && vehicles.length === 0 ? (
            <div className="rounded-sm border border-border/80 bg-card/80 p-10 text-center backdrop-blur-sm">
              <p className="text-muted-foreground">No vehicles match your search or filters.</p>
              {(search || activeFilterCount > 0) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    clearFilters();
                  }}
                >
                  Clear search and filters
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} href={`/vehicles/${vehicle.id}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <VehicleListItem
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
                className="border-border/80 bg-card/80 backdrop-blur-sm"
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
                className="border-border/80 bg-card/80 backdrop-blur-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
