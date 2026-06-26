export const VEHICLE_DAMAGE_OPTIONS = ["Yes", "No"] as const;

export const SERVICE_HISTORY_OPTIONS = [
  "Full Service History",
  "Partial Service History",
  "No Service History",
] as const;

export type VehicleDamage = (typeof VEHICLE_DAMAGE_OPTIONS)[number];
export type ServiceHistory = (typeof SERVICE_HISTORY_OPTIONS)[number];

export type VehicleDetails = {
  vin: string;
  licensePlateNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  numberOfKeys: number;
  vehicleDamage: string;
  serviceHistory: string;
  vehicleNotes: string;
};

export function getVehicleDetailRows(vehicle: VehicleDetails) {
  return [
    ["VIN", vehicle.vin],
    ["License Plate Number", vehicle.licensePlateNumber],
    ["Year", String(vehicle.year)],
    ["Make", vehicle.make],
    ["Model", vehicle.model],
    ["Trim", vehicle.trim],
    ["Odometer", `${new Intl.NumberFormat("en-AU").format(vehicle.odometer)} km`],
    ["Number of Keys", String(vehicle.numberOfKeys)],
    ["Vehicle Damage", vehicle.vehicleDamage],
    ["Service History", vehicle.serviceHistory],
  ] as const;
}