-- Run in Supabase SQL Editor (safe to run once).
-- Splits location into site + state, and adds reservation notes.

-- Vehicle site / state
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "site" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "state" TEXT;

-- Backfill from legacy location column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Vehicle' AND column_name = 'location'
  ) THEN
    UPDATE "Vehicle"
    SET
      "site" = COALESCE(NULLIF("site", ''), COALESCE("location", '')),
      "state" = COALESCE("state", '')
    WHERE COALESCE("site", '') = '' OR "site" IS NULL;
  END IF;
END $$;

UPDATE "Vehicle" SET "site" = '' WHERE "site" IS NULL;
UPDATE "Vehicle" SET "state" = '' WHERE "state" IS NULL;

ALTER TABLE "Vehicle" ALTER COLUMN "site" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "site" SET DEFAULT '';
ALTER TABLE "Vehicle" ALTER COLUMN "state" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "state" SET DEFAULT '';

CREATE INDEX IF NOT EXISTS "Vehicle_site_idx" ON "Vehicle"("site");
CREATE INDEX IF NOT EXISTS "Vehicle_state_idx" ON "Vehicle"("state");

-- Drop legacy location column/index if they exist
DROP INDEX IF EXISTS "Vehicle_location_idx";
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "location";

-- Reservation notes (partner / staff comments)
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "notes" TEXT;
