-- Run in Supabase SQL Editor to add location to existing Vehicle table.
-- Safe to run once.

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "location" TEXT;

UPDATE "Vehicle" SET "location" = '' WHERE "location" IS NULL;

ALTER TABLE "Vehicle" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "location" SET DEFAULT '';

CREATE INDEX IF NOT EXISTS "Vehicle_location_idx" ON "Vehicle"("location");
