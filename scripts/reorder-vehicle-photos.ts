/**
 * One-shot: rewrite VehiclePhoto.sortOrder for every vehicle using AMP label ranking.
 *
 * Matches labels from the storage object basename in `url` (e.g. FrontAngle in the path).
 * Photos without a recognizable name keep their relative order after Damage_*.
 *
 * Usage (from repo root, with DB URL in the environment):
 *   npx tsx scripts/reorder-vehicle-photos.ts
 *
 * Dry run (no writes):
 *   npx tsx scripts/reorder-vehicle-photos.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import {
  photoLabelFromUrl,
  photoLabelRank,
  sortByPhotoLabel,
  VEHICLE_PHOTO_SORT_ORDER,
} from "../src/lib/photo-order";

if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL / POSTGRES_PRISMA_URL. Set it in your shell before running this script."
  );
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

async function main() {
  console.log(
    `Reorder VehiclePhoto.sortOrder using: ${VEHICLE_PHOTO_SORT_ORDER.join(" → ")} → Damage_* → other`
  );
  if (dryRun) console.log("Dry run — no updates will be written.\n");

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

  console.log(
    JSON.stringify(
      {
        dryRun,
        vehiclesScanned: vehicles.length,
        vehiclesTouched,
        photosUpdated,
        photosRecognized,
        photosUnknown,
      },
      null,
      2
    )
  );

  if (photosUnknown > 0 && photosRecognized === 0) {
    console.log(
      "\nNote: no storage URLs contained AMP labels (e.g. FrontAngle). Older uploads used UUID-only paths, so relative order among photos was preserved but canonical AMP order could not be applied. New imports embed the label in the object key."
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
