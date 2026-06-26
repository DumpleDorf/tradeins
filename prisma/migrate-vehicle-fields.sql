-- Run in Supabase SQL Editor to update existing Vehicle table to new fields.
-- Safe to run once on databases created with the old schema.

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "licensePlateNumber" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "trim" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "odometer" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "numberOfKeys" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "vehicleDamage" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "serviceHistory" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "vehicleNotes" TEXT;

UPDATE "Vehicle" SET "odometer" = "mileage" WHERE "odometer" IS NULL AND "mileage" IS NOT NULL;
UPDATE "Vehicle" SET "vehicleNotes" = COALESCE("description", 'N/A') WHERE "vehicleNotes" IS NULL;
UPDATE "Vehicle" SET "licensePlateNumber" = 'N/A' WHERE "licensePlateNumber" IS NULL;
UPDATE "Vehicle" SET "trim" = 'N/A' WHERE "trim" IS NULL;
UPDATE "Vehicle" SET "numberOfKeys" = 1 WHERE "numberOfKeys" IS NULL;
UPDATE "Vehicle" SET "vehicleDamage" = 'No' WHERE "vehicleDamage" IS NULL;
UPDATE "Vehicle" SET "serviceHistory" = 'No Service History' WHERE "serviceHistory" IS NULL;
UPDATE "Vehicle" SET "odometer" = 0 WHERE "odometer" IS NULL;

ALTER TABLE "Vehicle" ALTER COLUMN "licensePlateNumber" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "trim" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "odometer" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "numberOfKeys" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "vehicleDamage" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "serviceHistory" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "vehicleNotes" SET NOT NULL;

DROP INDEX IF EXISTS "Vehicle_listPrice_idx";
DROP INDEX IF EXISTS "Vehicle_mileage_idx";
DROP INDEX IF EXISTS "Vehicle_conditionGrade_idx";

ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "mileage";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "exteriorColor";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "interiorColor";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "conditionGrade";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "listPrice";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "description";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "availableFrom";

CREATE INDEX IF NOT EXISTS "Vehicle_odometer_idx" ON "Vehicle"("odometer");
