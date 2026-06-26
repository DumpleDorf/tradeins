-- Run in Supabase SQL Editor to add price to existing Vehicle table.
-- Safe to run once.

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "price" INTEGER;

UPDATE "Vehicle" SET "price" = 0 WHERE "price" IS NULL;

ALTER TABLE "Vehicle" ALTER COLUMN "price" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Vehicle_price_idx" ON "Vehicle"("price");
