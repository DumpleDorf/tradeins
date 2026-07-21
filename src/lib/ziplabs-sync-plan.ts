import type { VehicleStatus } from "@prisma/client";

export type WebsiteVehicleRef = {
  id: string;
  status: VehicleStatus;
  make: string;
  model: string;
  year: number;
};

export type ZiplabsInconsistency = {
  rnNumber: string;
  reason: string;
  websiteStatus?: VehicleStatus;
  make?: string;
  model?: string;
  year?: number;
};

export type ZiplabsSyncPlan = {
  toCreate: string[];
  toDelete: WebsiteVehicleRef[];
  inconsistencies: ZiplabsInconsistency[];
  ignoredNotOnReport: { rnNumber: string; status: VehicleStatus; reason: string }[];
};

const ACTIVE_INVENTORY: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];

/**
 * ZipLabs report vs website inventory rules:
 * - On report, missing from site → create
 * - On report, already AVAILABLE/RESERVED/SOLD → inconsistency (do not create/update)
 * - On report, other site status (e.g. REJECTED) → inconsistency
 * - Not on report, AVAILABLE → delete
 * - Not on report, SOLD/RESERVED (and other non-available) → ignore
 */
export function buildZiplabsSyncPlan(
  reportRnNumbers: string[],
  websiteVehicles: WebsiteVehicleRef[]
): ZiplabsSyncPlan {
  const reportSet = new Set(reportRnNumbers.map((rn) => rn.trim().toUpperCase()));
  const byId = new Map(
    websiteVehicles.map((vehicle) => [vehicle.id.trim().toUpperCase(), vehicle])
  );

  const toCreate: string[] = [];
  const inconsistencies: ZiplabsInconsistency[] = [];
  const toDelete: WebsiteVehicleRef[] = [];
  const ignoredNotOnReport: ZiplabsSyncPlan["ignoredNotOnReport"] = [];

  for (const rn of reportSet) {
    const existing = byId.get(rn);
    if (!existing) {
      toCreate.push(rn);
      continue;
    }

    if (existing.status === "AVAILABLE") {
      inconsistencies.push({
        rnNumber: rn,
        reason: "On ZipLabs report but already AVAILABLE on the website",
        websiteStatus: existing.status,
        make: existing.make,
        model: existing.model,
        year: existing.year,
      });
      continue;
    }

    if (existing.status === "RESERVED") {
      inconsistencies.push({
        rnNumber: rn,
        reason: "On ZipLabs report but already RESERVED on the website",
        websiteStatus: existing.status,
        make: existing.make,
        model: existing.model,
        year: existing.year,
      });
      continue;
    }

    if (existing.status === "SOLD") {
      inconsistencies.push({
        rnNumber: rn,
        reason: "On ZipLabs report but already SOLD on the website",
        websiteStatus: existing.status,
        make: existing.make,
        model: existing.model,
        year: existing.year,
      });
      continue;
    }

    inconsistencies.push({
      rnNumber: rn,
      reason: `On ZipLabs report but already on the website as ${existing.status}`,
      websiteStatus: existing.status,
      make: existing.make,
      model: existing.model,
      year: existing.year,
    });
  }

  for (const vehicle of websiteVehicles) {
    const rn = vehicle.id.trim().toUpperCase();
    if (reportSet.has(rn)) continue;

    if (vehicle.status === "AVAILABLE") {
      toDelete.push(vehicle);
      continue;
    }

    if (ACTIVE_INVENTORY.includes(vehicle.status) || vehicle.status === "PENDING_APPROVAL" || vehicle.status === "REJECTED") {
      ignoredNotOnReport.push({
        rnNumber: rn,
        status: vehicle.status,
        reason:
          vehicle.status === "SOLD" || vehicle.status === "RESERVED"
            ? `Not on ZipLabs report; left as ${vehicle.status}`
            : `Not on ZipLabs report; ignored (${vehicle.status})`,
      });
    }
  }

  return { toCreate, toDelete, inconsistencies, ignoredNotOnReport };
}
