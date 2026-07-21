export const VEHICLE_DAMAGE_OPTIONS = ["Yes", "No"] as const;

export const SERVICE_HISTORY_OPTIONS = [
  "Full Service History",
  "Partial Service History",
  "Electronic Service History",
  "No Service History",
] as const;

export const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;

export type VehicleDamage = (typeof VEHICLE_DAMAGE_OPTIONS)[number];
export type ServiceHistory = (typeof SERVICE_HISTORY_OPTIONS)[number];
export type AuState = (typeof AU_STATES)[number];

export type VehicleDetails = {
  /** RN number — also the Vehicle primary key. */
  id: string;
  vin: string;
  licensePlateNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  price: number;
  site: string;
  state: string;
  numberOfKeys: number;
  vehicleDamage: string;
  serviceHistory: string;
  vehicleNotes: string;
};

export function formatVehiclePrice(price: number) {
  if (price <= 0) return "Unpriced";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatVehicleLocation(site?: string | null, state?: string | null) {
  const parts = [site?.trim(), state?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function getVehicleDetailRows(vehicle: VehicleDetails) {
  return [
    ["Vehicle RN", vehicle.id],
    ["VIN", vehicle.vin],
    ["License Plate Number", vehicle.licensePlateNumber],
    ["Year", String(vehicle.year)],
    ["Make", vehicle.make],
    ["Model", vehicle.model],
    ["Trim", vehicle.trim],
    ["Price", formatVehiclePrice(vehicle.price)],
    ["Site", vehicle.site || "—"],
    ["State", vehicle.state || "—"],
    ["Odometer", `${new Intl.NumberFormat("en-AU").format(vehicle.odometer)} km`],
    ["Number of Keys", String(vehicle.numberOfKeys)],
    ["Vehicle Damage", vehicle.vehicleDamage],
    ["Service History", vehicle.serviceHistory],
  ] as const;
}
