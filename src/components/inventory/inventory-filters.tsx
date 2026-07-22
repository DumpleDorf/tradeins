"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RangeSlider } from "@/components/ui/range-slider";
import { SERVICE_HISTORY_OPTIONS } from "@/lib/vehicle";
import { formatOdometer } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type InventoryFilterValues = {
  make: string;
  model: string;
  yearRange: [number, number];
  odometerRange: [number, number];
  vehicleDamage: "" | "Yes" | "No";
  serviceHistory: "" | (typeof SERVICE_HISTORY_OPTIONS)[number];
  state: string;
  status: "" | "AVAILABLE" | "RESERVED" | "SOLD";
};

export type InventoryMeta = {
  yearMin: number;
  yearMax: number;
  odometerMin: number;
  odometerMax: number;
  makes: string[];
  modelOptions: { make: string; model: string }[];
  serviceHistories: string[];
  states: string[];
};

type InventoryFiltersPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: InventoryFilterValues;
  onDraftChange: (draft: InventoryFilterValues) => void;
  meta: InventoryMeta;
  activeCount: number;
  onApply: () => void;
  onClear: () => void;
  showStatusFilter?: boolean;
};

export function countActiveInventoryFilters(
  filters: InventoryFilterValues,
  meta: InventoryMeta
): number {
  let count = 0;
  if (filters.make) count++;
  if (filters.model) count++;
  if (filters.yearRange[0] > meta.yearMin || filters.yearRange[1] < meta.yearMax) count++;
  if (filters.odometerRange[0] > meta.odometerMin || filters.odometerRange[1] < meta.odometerMax) {
    count++;
  }
  if (filters.vehicleDamage) count++;
  if (filters.serviceHistory) count++;
  if (filters.state) count++;
  if (filters.status) count++;
  return count;
}

export function createDefaultFilters(meta: InventoryMeta): InventoryFilterValues {
  return {
    make: "",
    model: "",
    yearRange: [meta.yearMin, meta.yearMax],
    odometerRange: [meta.odometerMin, meta.odometerMax],
    vehicleDamage: "",
    serviceHistory: "",
    state: "",
    status: "",
  };
}

export function InventoryFiltersPanel({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  meta,
  activeCount,
  onApply,
  onClear,
  showStatusFilter = false,
}: InventoryFiltersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  const availableModels = draft.make
    ? meta.modelOptions.filter((row) => row.make === draft.make).map((row) => row.model)
    : [...new Set(meta.modelOptions.map((row) => row.model))].sort();

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant={activeCount > 0 ? "default" : "outline"}
        className={cn(
          "gap-2 border-border/80 bg-card/80 backdrop-blur-sm",
          activeCount > 0 && "shadow-md shadow-tesla-red/20"
        )}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Inventory filters"
          className="absolute right-0 z-50 mt-2 flex w-[min(100vw-2rem,24rem)] max-h-[min(70vh,36rem)] flex-col overflow-hidden rounded-sm border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md animate-slide-up"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="font-semibold">Filters</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="filter-panel-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-6 pr-1">
              {showStatusFilter && (
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Status</Label>
                  <select
                    id="filter-status"
                    className="flex h-10 w-full rounded-sm border border-border bg-background/80 px-3 text-sm"
                    value={draft.status}
                    onChange={(e) =>
                      onDraftChange({
                        ...draft,
                        status: e.target.value as InventoryFilterValues["status"],
                      })
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="filter-make">Make</Label>
                <select
                  id="filter-make"
                  className="flex h-10 w-full rounded-sm border border-border bg-background/80 px-3 text-sm"
                  value={draft.make}
                  onChange={(e) =>
                    onDraftChange({ ...draft, make: e.target.value, model: "" })
                  }
                >
                  <option value="">All makes</option>
                  {meta.makes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-model">Model</Label>
                <select
                  id="filter-model"
                  className="flex h-10 w-full rounded-sm border border-border bg-background/80 px-3 text-sm"
                  value={draft.model}
                  onChange={(e) => onDraftChange({ ...draft, model: e.target.value })}
                >
                  <option value="">All models</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-state">State</Label>
                <select
                  id="filter-state"
                  className="flex h-10 w-full rounded-sm border border-border bg-background/80 px-3 text-sm"
                  value={draft.state}
                  onChange={(e) => onDraftChange({ ...draft, state: e.target.value })}
                >
                  <option value="">All states</option>
                  {(meta.states ?? []).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <RangeSlider
                  min={meta.yearMin}
                  max={meta.yearMax}
                  step={1}
                  value={draft.yearRange}
                  onChange={(yearRange) => onDraftChange({ ...draft, yearRange })}
                />
              </div>

              <div className="space-y-2">
                <Label>Odometer</Label>
                <RangeSlider
                  min={meta.odometerMin}
                  max={meta.odometerMax}
                  step={1000}
                  value={draft.odometerRange}
                  onChange={(odometerRange) => onDraftChange({ ...draft, odometerRange })}
                  formatValue={formatOdometer}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-damage">Vehicle damage</Label>
                <select
                  id="filter-damage"
                  className="flex h-10 w-full rounded-sm border border-border bg-background/80 px-3 text-sm"
                  value={draft.vehicleDamage}
                  onChange={(e) =>
                    onDraftChange({
                      ...draft,
                      vehicleDamage: e.target.value as InventoryFilterValues["vehicleDamage"],
                    })
                  }
                >
                  <option value="">Any</option>
                  <option value="No">No damage reported</option>
                  <option value="Yes">Damage reported</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-service">Service history</Label>
                <select
                  id="filter-service"
                  className="flex h-10 w-full rounded-sm border border-border bg-background/80 px-3 text-sm"
                  value={draft.serviceHistory}
                  onChange={(e) =>
                    onDraftChange({
                      ...draft,
                      serviceHistory: e.target.value as InventoryFilterValues["serviceHistory"],
                    })
                  }
                >
                  <option value="">Any</option>
                  {SERVICE_HISTORY_OPTIONS.filter((option) =>
                    meta.serviceHistories.includes(option)
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-border/50 bg-card/95 px-5 py-4">
            <Button className="flex-1" onClick={onApply}>
              Apply filters
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClear}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
