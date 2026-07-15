-- Run this in Supabase → SQL Editor (after init.sql)
-- Demo logins created by this script:
--   superadmin@tesla.com      / SuperAdmin123!
--   lister@tesla.com          / TeslaEmployee123!
--   partner@wholesale.com     / Partner123!

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "status", "createdAt", "updatedAt")
VALUES
  (
    'user_superadmin_001',
    'superadmin@tesla.com',
    '$2a$12$u6kN.vdPS2L8lg9u9vtEX.lonInC6MAXz.z6TnLBR64txrTn2qGfm',
    'Super Admin',
    'SUPER_ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'user_tesla_001',
    'lister@tesla.com',
    '$2a$12$N2iTLH4Us4u2QDfLe0XBluIgMA.fmTRlBX3bJhCZTxpzSiLyL5PHq',
    'Tesla Lister',
    'TESLA_EMPLOYEE',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'user_partner_001',
    'partner@wholesale.com',
    '$2a$12$Z6bygUQTwdo2xT9qzFzNy.Th/gP3BhtfZdgWRSSGvYKqqMeLMSBla',
    'Wholesale Partner',
    'PARTNER',
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "PartnerProfile" ("id", "userId", "companyName", "contactName", "contactPhone", "createdAt", "updatedAt")
VALUES (
  'partner_profile_001',
  'user_partner_001',
  'Premium Auto Wholesale',
  'John Smith',
  '+61 400 000 000',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "Vehicle" (
  "id", "vin", "licensePlateNumber", "year", "make", "model", "trim",
  "odometer", "price", "location", "numberOfKeys", "vehicleDamage", "serviceHistory", "vehicleNotes",
  "status", "listedById", "createdAt", "updatedAt"
)
VALUES (
  'vehicle_demo_001',
  'JF1GT7KL5MG123216',
  '319CN4',
  2021,
  'Subaru',
  'Impreza',
  'G5 MY21 2.0i Premium Hatchback. 5dr CVT 7sp AWD',
  32000,
  24900,
  'Sydney',
  2,
  'No',
  'Partial Service History',
  'N/A',
  'AVAILABLE',
  'user_tesla_001',
  NOW(),
  NOW()
)
ON CONFLICT ("vin") DO NOTHING;

INSERT INTO "VehiclePhoto" ("id", "vehicleId", "url", "sortOrder", "createdAt")
VALUES (
  'vehicle_photo_001',
  'vehicle_demo_001',
  'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-3-Performance-LHD.png',
  0,
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "SystemSetting" ("id", "key", "value", "updatedAt")
VALUES (
  'setting_notify_001',
  'notify_partners_on_new_listing',
  'false',
  NOW()
)
ON CONFLICT ("key") DO NOTHING;
