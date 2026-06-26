-- Fix login passwords (run in Supabase → SQL Editor)
-- Passwords: SuperAdmin123! / TeslaEmployee123! / Partner123!

-- First, confirm users exist:
SELECT "email", "role", "status" FROM "User";

-- If 0 rows, run prisma/seed.sql first, then run the UPDATEs below.

UPDATE "User" SET "passwordHash" = '$2a$12$Aj3xUnn8l9tVL5qXlX5rpeMRCP1hrofRlgYZJ2PZrDPZhjPw2ZWQy', "updatedAt" = NOW() WHERE "email" = 'superadmin@tesla.com';
UPDATE "User" SET "passwordHash" = '$2a$12$cNeFDJ1KUW2IEMBcMl7z5uX5ka2kQrJBNxT0YxxuA2Obwt9fwJHXu', "updatedAt" = NOW() WHERE "email" = 'lister@tesla.com';
UPDATE "User" SET "passwordHash" = '$2a$12$dAvneD4rf/w8wc55KF/40ON5Upp86k8pDb072wDXPxYtWufaDMlou', "updatedAt" = NOW() WHERE "email" = 'partner@wholesale.com';
