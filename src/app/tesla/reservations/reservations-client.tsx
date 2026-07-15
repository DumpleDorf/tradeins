"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StatusBadge } from "@/components/disclaimer";
import { VehicleImage } from "@/components/vehicle-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  countActiveInventoryFilters,
  createDefaultFilters,
  InventoryFiltersPanel,
  type InventoryFilterValues,
  type InventoryMeta,
} from "@/components/inventory/inventory-filters";
import {
  DEFAULT_VEHICLE_BROWSE_META,
  VEHICLE_BROWSE_SORT_OPTIONS,
  vehicleBrowseFiltersToParams,
  type VehicleBrowseSort,
} from "@/lib/vehicle-browse";
import { formatVehicleLocation, formatVehiclePrice } from "@/lib/vehicle";
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
  site?: string;
  state?: string;
  status: string;
  odometer: number;
  photos: { url: string }[];
  reservedAt: string | null;
  notes: string | null;
  partner: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
    contactName: string | null;
  } | null;
};

export default function TeslaReservationsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const defaultStatus =
    initialStatus === "SOLD" || initialStatus === "RESERVED" ? initialStatus : "RESERVED";

  const [vehicles, setVehicles] = useState<ReservedVehicle[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<InventoryMeta>(DEFAULT_VEHICLE_BROWSE_META);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<VehicleBrowseSort>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<InventoryFilterValues>(() => ({
    ...createDefaultFilters(DEFAULT_VEHICLE_BROWSE_META),
    status: defaultStatus,
  }));
  const [appliedFilters, setAppliedFilters] = useState<InventoryFilterValues>(() => ({
    ...createDefaultFilters(DEFAULT_VEHICLE_BROWSE_META),
    status: defaultStatus,
  }));
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const metaRef = useRef(meta);
  metaRef.current = meta;
  const hasLoadedRef = useRef(false);
  const metaReadyRef = useRef(false);

  const fetchVehicles = useCallback(async () => {
    if (!hasLoadedRef.current) setInitialLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const params = vehicleBrowseFiltersToParams(
        appliedFilters,
        metaRef.current,
        sort,
        search,
        page
      );
      if (appliedFilters.status) params.set("status", appliedFilters.status);

      const res = await fetch(`/api/tesla/reserved-vehicles?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load vehicles");
      }

      setVehicles(data.vehicles ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);

      if (data.meta && !metaReadyRef.current) {
        metaReadyRef.current = true;
        setMeta(data.meta);
        const defaults = {
          ...createDefaultFilters(data.meta),
          status: (appliedFilters.status || defaultStatus) as InventoryFilterValues["status"],
        };
        setDraftFilters(defaults);
        setAppliedFilters((current) =>
          current.status === defaults.status ? { ...defaults, status: current.status } : defaults
        );
      } else if (data.meta) {
        setMeta(data.meta);
      }
    } catch (err) {
      setVehicles([]);
      setTotal(0);
      setTotalPages(1);
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      hasLoadedRef.current = true;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [appliedFilters, sort, search, page, defaultStatus]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [filtersOpen, appliedFilters]);

  const activeFilterCount = useMemo(
    () => countActiveInventoryFilters(appliedFilters, meta),
    [appliedFilters, meta]
  );

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearch();
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }

  function clearFilters() {
    const defaults = {
      ...createDefaultFilters(meta),
      status: "" as const,
    };
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
    setFiltersOpen(false);
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
    await fetchVehicles();
  }

  return (
    <PageShell>
      <LoadingOverlay
        show={initialLoading || actionId !== null}
        label={actionId ? "Marking vehicle as sold..." : "Loading reservations..."}
      />

      <PageHeader
        title="Reservations"
        description="Review reservation requests and sold vehicles. Confirm sales by marking reserved vehicles as sold."
      />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="space-y-4">
        <div className="relative animate-slide-up">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by make, model, trim, rego, site, state, or year..."
            className="h-11 border-border/80 bg-card/80 pl-10 pr-24 backdrop-blur-sm"
            aria-label="Search reserved vehicles"
          />
          <Button
            type="button"
            size="sm"
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 px-3"
            onClick={applySearch}
            disabled={refreshing}
          >
            Search
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {refreshing
              ? "Updating results..."
              : `${total} vehicle${total === 1 ? "" : "s"} found`}
            {search && <span className="ml-2 text-foreground/80">· &ldquo;{search}&rdquo;</span>}
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
              showStatusFilter
            />

            <select
              id="reservations-sort"
              className="h-10 rounded-sm border border-border/80 bg-card/80 px-3 text-sm backdrop-blur-sm"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as VehicleBrowseSort);
                setPage(1);
              }}
            >
              {VEHICLE_BROWSE_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cn("mt-8 space-y-4 transition-opacity", refreshing && "opacity-60")}>
        {!initialLoading && !refreshing && vehicles.length === 0 ? (
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
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="animate-stagger-in flex flex-col gap-4 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:border-tesla-red/30 sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-sm bg-muted sm:h-28 sm:w-40">
                {vehicle.photos[0]?.url ? (
                  <VehicleImage
                    src={vehicle.photos[0].url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <StatusBadge status={vehicle.status} />
                </div>
                <p className="line-clamp-1 text-sm text-muted-foreground">{vehicle.trim}</p>
                <p className="text-sm text-muted-foreground">
                  VIN: {vehicle.vin} · Plate {vehicle.licensePlateNumber} ·{" "}
                  {formatVehiclePrice(vehicle.price)}
                  {formatVehicleLocation(vehicle.site, vehicle.state) !== "—"
                    ? ` · ${formatVehicleLocation(vehicle.site, vehicle.state)}`
                    : ""}
                </p>
                {vehicle.partner && (
                  <p className="text-sm">
                    Wholesaler: {vehicle.partner.companyName ?? vehicle.partner.name}
                    {vehicle.partner.contactName ? ` — ${vehicle.partner.contactName}` : ""} (
                    {vehicle.partner.email})
                  </p>
                )}
                {vehicle.notes && (
                  <p className="text-sm text-muted-foreground">Notes: {vehicle.notes}</p>
                )}
                {vehicle.reservedAt && (
                  <p className="text-xs text-muted-foreground">
                    Reserved {new Date(vehicle.reservedAt).toLocaleString("en-AU")}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
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
          ))
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
    </PageShell>
  );
}
