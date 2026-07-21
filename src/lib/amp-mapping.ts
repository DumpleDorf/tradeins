import { VEHICLE_PHOTO_SORT_ORDER } from "@/lib/photo-order";
import { AU_STATES, type AuState } from "@/lib/vehicle";

/** Photo tile titles scraped from AMP (case-insensitive match / contains). Also allow Damage_*. */
export const AMP_ALLOWED_PHOTO_TITLES = VEHICLE_PHOTO_SORT_ORDER;

const SERVICE_HISTORY_MAP: Record<string, string> = {
  COMPLETE_SERVICE_HISTORY: "Full Service History",
  PARTIAL_SERVICE_HISTORY: "Partial Service History",
  ELECTRONIC_SERVICE_HISTORY: "Electronic Service History",
  NO_SERVICE_HISTORY: "No Service History",
  "Complete Service History": "Full Service History",
  "Partial Service History": "Partial Service History",
  "Electronic Service History": "Electronic Service History",
  "No Service History": "No Service History",
  "Full Service History": "Full Service History",
};

export type AmpScrapedFields = {
  vin: string;
  licensePlateNumber: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  odometer: string;
  finalOffer: string;
  numberOfKeys: string;
  isDamage: string;
  serviceHistory: string;
  vehicleNotes: string;
};

export type AmpScrapedPhoto = {
  title: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
};

/** State is the 3rd dash-separated segment of ServiceCenterforPickUp (e.g. AP-AU-QLD-...). */
export function extractStateFromServiceCenter(site: string): AuState | "" {
  const parts = site.split("-").map((part) => part.trim());
  const state = (parts[2] ?? "").toUpperCase();
  return (AU_STATES as readonly string[]).includes(state) ? (state as AuState) : "";
}

export function mapAmpDamage(value: string): "Yes" | "No" {
  const normalized = value.trim().toUpperCase();
  if (normalized === "YES" || normalized === "Y") return "Yes";
  return "No";
}

export function mapAmpServiceHistory(value: string): string {
  const trimmed = value.trim();
  return SERVICE_HISTORY_MAP[trimmed] ?? SERVICE_HISTORY_MAP[trimmed.toUpperCase()] ?? "No Service History";
}

export function parseAmpPrice(finalOffer: string): number {
  const digits = finalOffer.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function parseAmpKeys(value: string): number {
  const n = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, 10);
}

export function mapAmpScrapeToVehicleInput(args: {
  rnNumber: string;
  site: string;
  fields: AmpScrapedFields;
}) {
  const state = extractStateFromServiceCenter(args.site);
  return {
    id: args.rnNumber.trim().toUpperCase(),
    vin: args.fields.vin.trim(),
    licensePlateNumber: args.fields.licensePlateNumber.trim() || "UNKNOWN",
    year: Number.parseInt(args.fields.year.trim(), 10),
    make: args.fields.make.trim(),
    model: args.fields.model.trim(),
    trim: args.fields.trim.trim() || "—",
    odometer: Number.parseInt(args.fields.odometer.replace(/[^0-9]/g, "") || "0", 10),
    price: parseAmpPrice(args.fields.finalOffer),
    site: args.site.trim() || "Unknown",
    state: state || "NSW",
    numberOfKeys: parseAmpKeys(args.fields.numberOfKeys),
    vehicleDamage: mapAmpDamage(args.fields.isDamage),
    serviceHistory: mapAmpServiceHistory(args.fields.serviceHistory),
    vehicleNotes: args.fields.vehicleNotes?.trim() ?? "",
  };
}
