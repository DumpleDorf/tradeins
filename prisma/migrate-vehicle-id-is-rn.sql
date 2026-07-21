-- 1) Clear existing inventory (old cuid PKs cannot become RNs).
-- 2) Rename Vehicle primary key column id → vehicleRn.
--
-- Run once in Supabase SQL Editor.
-- DELETES all vehicles, photos, reservations, and vehicle audit rows.

BEGIN;

DELETE FROM "Reservation";
DELETE FROM "VehiclePhoto";
DELETE FROM "Vehicle";
DELETE FROM "AuditLog" WHERE "entityType" = 'Vehicle';

-- Rename PK column (FK references update automatically in Postgres).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Vehicle'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE "Vehicle" RENAME COLUMN "id" TO "vehicleRn";
  END IF;
END $$;

ALTER TABLE "Vehicle" DROP CONSTRAINT IF EXISTS "Vehicle_id_rn_check";
ALTER TABLE "Vehicle" DROP CONSTRAINT IF EXISTS "Vehicle_vehicleRn_rn_check";
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_vehicleRn_rn_check"
  CHECK ("vehicleRn" ~ '^RN[0-9]+$');

COMMIT;
