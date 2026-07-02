"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
  vehicleBrowseFiltersToParams,
  type VehicleBrowseSort,
  type VehicleBrowseViewMode,
} from "@/lib/vehicle-browse";
import { cn } from "@/lib/utils";

type BrowseVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  price: number;
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
};

export function VehicleBrowse({
  apiEndpoint,
  storageKey,
  vehicleBasePath,
  loadingLabel = "Loading vehicles...",
  emptyMessage = "No vehicles match your search or filters.",
  searchPlaceholder = "Search by make, model, trim, rego, or year...",
  sortSelectId = "vehicle-browse-sort",
  showStatus = false,
}: VehicleBrowseProps) {
  const [vehicles, setVehicles] = useState<BrowseVehicle[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<InventoryMeta>(DEFAULT_VEHICLE_BROWSE_META);
  const [metaReady, setMetaReady] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<VehicleBrowseSort>("newest");
  const [viewMode, setViewMode] = useState<VehicleBrowseViewMode>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftFilters, setDraftFilters] = useState<InventoryFilterValues>(
    createDefaultFilters(DEFAULT_VEHICLE_BROWSE_META)
  );
  const [appliedFilters, setAppliedFilters] = useState<InventoryFilterValues>(
    createDefaultFilters(DEFAULT_VEHICLE_BROWSE_META)
  );

  const metaRef = useRef(meta);
  metaRef.current = meta;
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, viewMode);
  }, [storageKey, viewMode]);

  const fetchVehicles = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    const params = vehicleBrowseFiltersToParams(
      appliedFilters,
      metaRef.current,
      sort,
      search,
      page
    );

    const res = await fetch(`${apiEndpoint}?${params}`);
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

    hasLoadedRef.current = true;
    setInitialLoading(false);
    setRefreshing(false);
  }, [apiEndpoint, appliedFilters, sort, search, page, metaReady]);

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
    const defaults = createDefaultFilters(meta);
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
    setFiltersOpen(false);
  }

  function clearSearchAndFilters() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    clearFilters();
  }

  const searchPending = searchInput.trim() !== search.trim();

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
        {!initialLoading && !refreshing && vehicles.length === 0 ? (
          <div className="rounded-sm border border-border/80 bg-card/80 p-10 text-center backdrop-blur-sm">
            <p className="text-muted-foreground">{emptyMessage}</p>
            {(search || activeFilterCount > 0) && (
              <Button variant="outline" className="mt-4" onClick={clearSearchAndFilters}>
                Clear search and filters
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                href={`${vehicleBasePath}${vehicle.id}`}
                showStatus={showStatus}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <VehicleListItem
                key={vehicle.id}
                vehicle={vehicle}
                href={`${vehicleBasePath}${vehicle.id}`}
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
    </>
  );
}
