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
import { VEHICLE_PHOTO_SORT_ORDER } from "../src/lib/photo-order";
import { reorderAllVehiclePhotos } from "../src/lib/reorder-vehicle-photos";

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

  const result = await reorderAllVehiclePhotos(prisma, { dryRun });
  console.log(JSON.stringify(result, null, 2));

  if (result.photosUnknown > 0 && result.photosRecognized === 0) {
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
