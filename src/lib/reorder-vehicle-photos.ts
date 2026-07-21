import type { PrismaClient } from "@prisma/client";
import {
  photoLabelFromUrl,
  photoLabelRank,
  sortByPhotoLabel,
  VEHICLE_PHOTO_SORT_ORDER,
} from "./photo-order";

export type ReorderVehiclePhotosResult = {
  dryRun: boolean;
  vehiclesScanned: number;
  vehiclesTouched: number;
  photosUpdated: number;
  photosRecognized: number;
  photosUnknown: number;
};

type PrismaLike = Pick<PrismaClient, "vehicle" | "vehiclePhoto">;

/**
 * Rewrite VehiclePhoto.sortOrder for every vehicle using AMP label ranking.
 * Only updates rows whose sortOrder would change (safe to re-run).
 */
export async function reorderAllVehiclePhotos(
  prisma: PrismaLike,
  options: { dryRun?: boolean } = {}
): Promise<ReorderVehiclePhotosResult> {
  const dryRun = Boolean(options.dryRun);

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      photos: {
        select: { id: true, url: true, sortOrder: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  let vehiclesTouched = 0;
  let photosUpdated = 0;
  let photosRecognized = 0;
  let photosUnknown = 0;

  for (const vehicle of vehicles) {
    if (vehicle.photos.length === 0) continue;

    const ordered = sortByPhotoLabel(vehicle.photos, (photo) => photoLabelFromUrl(photo.url));

    let changed = false;
    for (let i = 0; i < ordered.length; i += 1) {
      const photo = ordered[i];
      const label = photoLabelFromUrl(photo.url);
      const { rank } = photoLabelRank(label);
      if (rank < VEHICLE_PHOTO_SORT_ORDER.length + 1) {
        photosRecognized += 1;
      } else {
        photosUnknown += 1;
      }
      if (photo.sortOrder !== i) {
        changed = true;
        photosUpdated += 1;
        if (!dryRun) {
          await prisma.vehiclePhoto.update({
            where: { id: photo.id },
            data: { sortOrder: i },
          });
        }
      }
    }

    if (changed) vehiclesTouched += 1;
  }

  return {
    dryRun,
    vehiclesScanned: vehicles.length,
    vehiclesTouched,
    photosUpdated,
    photosRecognized,
    photosUnknown,
  };
}
