import type { InventoryFilterValues, InventoryMeta } from "@/components/inventory/inventory-filters";

export type VehicleBrowseSort =
  | "newest"
  | "oldest"
  | "year_desc"
  | "year_asc"
  | "odometer_asc"
  | "odometer_desc"
  | "price_asc"
  | "price_desc";

export type VehicleBrowseViewMode = "grid" | "list";

const VEHICLE_BROWSE_SORT_VALUES: VehicleBrowseSort[] = [
  "newest",
  "oldest",
  "year_desc",
  "year_asc",
  "odometer_asc",
  "odometer_desc",
  "price_asc",
  "price_desc",
];

export function parseBrowsePageParam(value: string | null): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

export function parseBrowseSortParam(value: string | null): VehicleBrowseSort {
  if (value && VEHICLE_BROWSE_SORT_VALUES.includes(value as VehicleBrowseSort)) {
    return value as VehicleBrowseSort;
  }
  return "newest";
}

export const VEHICLE_BROWSE_SORT_OPTIONS: { value: VehicleBrowseSort; label: string }[] = [
  { value: "newest", label: "Newest listed" },
  { value: "oldest", label: "Oldest listed" },
  { value: "year_desc", label: "Year: New to old" },
  { value: "year_asc", label: "Year: Old to new" },
  { value: "odometer_asc", label: "Odometer: Low to high" },
  { value: "odometer_desc", label: "Odometer: High to low" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
];

export const DEFAULT_VEHICLE_BROWSE_META: InventoryMeta = {
  yearMin: new Date().getFullYear() - 10,
  yearMax: new Date().getFullYear(),
  odometerMin: 0,
  odometerMax: 200000,
  makes: [],
  modelOptions: [],
  serviceHistories: [],
  states: [],
};

export function vehicleBrowseFiltersToParams(
  filters: InventoryFilterValues,
  meta: InventoryMeta,
  sort: VehicleBrowseSort,
  search: string,
  page: number
) {
  const params = new URLSearchParams({ page: String(page), sort });
  if (search.trim()) params.set("search", search.trim());
  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.vehicleDamage) params.set("vehicleDamage", filters.vehicleDamage);
  if (filters.serviceHistory) params.set("serviceHistory", filters.serviceHistory);
  if (filters.state) params.set("state", filters.state);
  if (filters.status) params.set("status", filters.status);
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
