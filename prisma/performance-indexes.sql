-- Tesla Wholesale Portal — performance indexes for Supabase
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Safe to re-run: uses IF NOT EXISTS throughout.
-- These match how the app queries reservations, inventory, listings, and photos.

-- ---------------------------------------------------------------------------
-- 1. Extensions (speeds up inventory make/model "contains" search)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 2. Reservation — Tesla reservations page sorts by reservedAt DESC
--    Partner "My Reservations" filters by partnerId + sorts by reservedAt
--    Status filter buttons filter by status + sort by reservedAt
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Reservation_reservedAt_idx"
  ON "Reservation" ("reservedAt" DESC);

CREATE INDEX IF NOT EXISTS "Reservation_partnerId_reservedAt_idx"
  ON "Reservation" ("partnerId", "reservedAt" DESC);

CREATE INDEX IF NOT EXISTS "Reservation_status_reservedAt_idx"
  ON "Reservation" ("status", "reservedAt" DESC);

-- ---------------------------------------------------------------------------
-- 3. Vehicle — inventory + listings sort by createdAt or odometer
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Vehicle_createdAt_idx"
  ON "Vehicle" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Vehicle_status_createdAt_idx"
  ON "Vehicle" ("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Vehicle_status_odometer_idx"
  ON "Vehicle" ("status", "odometer");

-- Partial index: partner inventory only shows AVAILABLE vehicles
CREATE INDEX IF NOT EXISTS "Vehicle_available_createdAt_idx"
  ON "Vehicle" ("createdAt" DESC)
  WHERE status = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS "Vehicle_available_odometer_idx"
  ON "Vehicle" ("odometer")
  WHERE status = 'AVAILABLE';

-- Trigram indexes for ILIKE '%tesla%' style filters on inventory page
CREATE INDEX IF NOT EXISTS "Vehicle_make_trgm_idx"
  ON "Vehicle" USING gin (lower("make") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Vehicle_model_trgm_idx"
  ON "Vehicle" USING gin (lower("model") gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 4. VehiclePhoto — every list loads first photo ordered by sortOrder
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "VehiclePhoto_vehicleId_sortOrder_idx"
  ON "VehiclePhoto" ("vehicleId", "sortOrder");

-- ---------------------------------------------------------------------------
-- 5. Partner profile — company name shown/joined on every reservation row
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "PartnerProfile_companyName_idx"
  ON "PartnerProfile" ("companyName");

CREATE INDEX IF NOT EXISTS "PartnerProfile_companyName_trgm_idx"
  ON "PartnerProfile" USING gin (lower("companyName") gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 6. User — partners list filters role = PARTNER, orders by createdAt
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx"
  ON "User" ("role", "createdAt" DESC);

-- ---------------------------------------------------------------------------
-- 7. Refresh planner statistics (run after creating indexes)
-- ---------------------------------------------------------------------------
ANALYZE "Reservation";
ANALYZE "Vehicle";
ANALYZE "VehiclePhoto";
ANALYZE "PartnerProfile";
ANALYZE "User";
ANALYZE "AuditLog";
