"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search } from "lucide-react";
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
import {
  DEFAULT_VEHICLE_BROWSE_META,
  VEHICLE_BROWSE_SORT_OPTIONS,
  parseBrowsePageParam,
  parseBrowseSortParam,
  vehicleBrowseFiltersToParams,
  type VehicleBrowseSort,
  type VehicleBrowseViewMode,
} from "@/lib/vehicle-browse";
import { getBrowseReturnPath, withBrowseReturn } from "@/lib/browse-return";
import { cn } from "@/lib/utils";

type BrowseVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  price: number;
  site?: string;
  state?: string;
  licensePlateNumber: string;
  status?: string;
  photos: { url: string }[];
};

type VehicleBrowseProps = {
  apiEndpoint: string;
  storageKey: string;
  vehicleBasePath: string;
  loadingLabel?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  sortSelectId?: string;
  showStatus?: boolean;
  showStatusFilter?: boolean;
};

function parseStatusParam(value: string | null): InventoryFilterValues["status"] {
  if (!value || value === "ALL") return "";
  if (value === "AVAILABLE" || value === "RESERVED" || value === "SOLD") return value;
  return "";
}

export function VehicleBrowse({
  apiEndpoint,
  storageKey,
  vehicleBasePath,
  loadingLabel = "Loading vehicles...",
  emptyMessage = "No vehicles match your search or filters.",
  searchPlaceholder = "Search by make, model, trim, rego, site, state, or year...",
  sortSelectId = "vehicle-browse-sort",
  showStatus = false,
  showStatusFilter = false,
}: VehicleBrowseProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseBrowsePageParam(searchParams.get("page"));
  const sort = parseBrowseSortParam(searchParams.get("sort"));
  const urlStatus = parseStatusParam(searchParams.get("status"));

  const [vehicles, setVehicles] = useState<BrowseVehicle[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<InventoryMeta>(DEFAULT_VEHICLE_BROWSE_META);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<VehicleBrowseViewMode>("list");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftFilters, setDraftFilters] = useState<InventoryFilterValues>(() => ({
    ...createDefaultFilters(DEFAULT_VEHICLE_BROWSE_META),
    status: urlStatus,
  }));
  const [appliedFilters, setAppliedFilters] = useState<InventoryFilterValues>(() => ({
    ...createDefaultFilters(DEFAULT_VEHICLE_BROWSE_META),
    status: urlStatus,
  }));

  const metaRef = useRef(meta);
  metaRef.current = meta;
  const hasLoadedRef = useRef(false);
  const metaReadyRef = useRef(false);

  const replaceBrowseParams = useCallback(
    (updates: {
      page?: number;
      sort?: VehicleBrowseSort;
      status?: InventoryFilterValues["status"];
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPage = updates.page ?? page;
      const nextSort = updates.sort ?? sort;
      const nextStatus = updates.status !== undefined ? updates.status : urlStatus;

      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");

      if (nextSort !== "newest") params.set("sort", nextSort);
      else params.delete("sort");

      if (nextStatus) params.set("status", nextStatus);
      else params.delete("status");

      const qs = params.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [page, pathname, router, searchParams, sort, urlStatus]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, viewMode);
  }, [storageKey, viewMode]);

  // Keep filters in sync when landing via reporting / dashboard status links.
  useEffect(() => {
    setDraftFilters((current) =>
      current.status === urlStatus ? current : { ...current, status: urlStatus }
    );
    setAppliedFilters((current) =>
      current.status === urlStatus ? current : { ...current, status: urlStatus }
    );
  }, [urlStatus]);

  const fetchVehicles = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    setError("");

    try {
      const params = vehicleBrowseFiltersToParams(
        appliedFilters,
        metaRef.current,
        sort,
        search,
        page
      );

      const res = await fetch(`${apiEndpoint}?${params}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to load vehicles"
        );
      }

      setVehicles(data.vehicles ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);

      if (data.meta) {
        setMeta(data.meta);
        if (!metaReadyRef.current) {
          metaReadyRef.current = true;
          const defaults = createDefaultFilters(data.meta);
          // Preserve URL / user-selected discrete filters; only refresh range bounds from meta.
          const mergeWithMetaBounds = (current: InventoryFilterValues): InventoryFilterValues => ({
            ...defaults,
            make: current.make,
            model: current.model,
            vehicleDamage: current.vehicleDamage,
            serviceHistory: current.serviceHistory,
            state: current.state,
            status: current.status,
          });
          setDraftFilters((current) => mergeWithMetaBounds(current));
          // Avoid an extra dependency-driven refetch loop on first meta hydrate.
          setAppliedFilters((current) => {
            const next = mergeWithMetaBounds(current);
            const same =
              current.make === next.make &&
              current.model === next.model &&
              current.vehicleDamage === next.vehicleDamage &&
              current.serviceHistory === next.serviceHistory &&
              current.state === next.state &&
              current.status === next.status &&
              current.yearRange[0] === next.yearRange[0] &&
              current.yearRange[1] === next.yearRange[1] &&
              current.odometerRange[0] === next.odometerRange[0] &&
              current.odometerRange[1] === next.odometerRange[1];
            return same ? current : next;
          });
        }
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
  }, [apiEndpoint, appliedFilters, sort, search, page]);

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
    replaceBrowseParams({ page: 1 });
    setSearch(searchInput.trim());
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearch();
    }
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    replaceBrowseParams({ page: 1, status: draftFilters.status });
    setFiltersOpen(false);
  }

  function clearFilters() {
    const defaults = createDefaultFilters(meta);
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    replaceBrowseParams({ page: 1, status: "" });
    setFiltersOpen(false);
  }

  function clearSearchAndFilters() {
    setSearchInput("");
    setSearch("");
    clearFilters();
  }

  const searchPending = searchInput.trim() !== search.trim();

  const browseReturnPath = getBrowseReturnPath(pathname, searchParams);
  const vehicleHref = (vehicleId: string) =>
    withBrowseReturn(`${vehicleBasePath}${vehicleId}`, browseReturnPath);

  return (
    <>
      <LoadingOverlay show={initialLoading} label={loadingLabel} />

      <div className="space-y-4">
        <div className="relative animate-slide-up">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            className="h-11 border-border/80 bg-card/80 pl-10 pr-24 backdrop-blur-sm"
            aria-label="Search vehicles"
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
            {searchPending && (
              <span className="ml-2 text-tesla-red">· Press Search to apply</span>
            )}
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
              showStatusFilter={showStatusFilter}
            />

            <div className="flex items-center gap-2">
              <label htmlFor={sortSelectId} className="sr-only">
                Sort by
              </label>
              <select
                id={sortSelectId}
                className="h-10 rounded-sm border border-border/80 bg-card/80 px-3 text-sm backdrop-blur-sm"
                value={sort}
                onChange={(e) => {
                  replaceBrowseParams({
                    page: 1,
                    sort: e.target.value as VehicleBrowseSort,
                  });
                }}
              >
                {VEHICLE_BROWSE_SORT_OPTIONS.map((option) => (
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

      <div className={cn("mt-8 transition-opacity duration-200", refreshing && "opacity-60")}>
        {error ? (
          <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-10 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchVehicles()}>
              Try again
            </Button>
          </div>
        ) : !initialLoading && !refreshing && vehicles.length === 0 ? (
          <div className="rounded-sm border border-border/80 bg-card/80 p-10 text-center backdrop-blur-sm">
            <p className="text-muted-foreground">{emptyMessage}</p>
            {(search || activeFilterCount > 0) && (
              <Button variant="outline" className="mt-4" onClick={clearSearchAndFilters}>
                Clear search and filters
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                href={vehicleHref(vehicle.id)}
                showStatus={showStatus}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <VehicleListItem
                key={vehicle.id}
                vehicle={vehicle}
                href={vehicleHref(vehicle.id)}
                showStatus={showStatus}
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
              onClick={() => replaceBrowseParams({ page: page - 1 })}
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
              onClick={() => replaceBrowseParams({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
