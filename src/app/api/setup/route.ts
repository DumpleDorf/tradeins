import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json(
      { error: "SETUP_SECRET not configured" },
      { status: 503 }
    );
  }

  const { secret } = await request.json();
  if (secret !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    execSync("npx prisma db push --skip-generate", { stdio: "pipe" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const existing = await prisma.user.count();
  if (existing > 0) {
    return NextResponse.json({ message: "Database already seeded", users: existing });
  }

  const superAdminPassword = await hashPassword("SuperAdmin123!");
  const teslaPassword = await hashPassword("TeslaEmployee123!");
  const partnerPassword = await hashPassword("Partner123!");

  const teslaEmployee = await prisma.user.create({
    data: {
      email: "lister@tesla.com",
      name: "Tesla Lister",
      passwordHash: teslaPassword,
      role: "TESLA_EMPLOYEE",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "superadmin@tesla.com",
      name: "Super Admin",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "partner@wholesale.com",
      name: "Wholesale Partner",
      passwordHash: partnerPassword,
      role: "PARTNER",
      status: "ACTIVE",
      partnerProfile: {
        create: {
          companyName: "Premium Auto Wholesale",
          contactName: "John Smith",
          contactPhone: "+61 400 000 000",
        },
      },
    },
  });

  await prisma.vehicle.create({
    data: {
      id: "RN000000001",
      vin: "JF1GT7KL5MG123216",
      licensePlateNumber: "319CN4",
      year: 2021,
      make: "Subaru",
      model: "Impreza",
      trim: "G5 MY21 2.0i Premium Hatchback. 5dr CVT 7sp AWD",
      odometer: 32000,
      price: 24900,
      site: "Alexandria",
      state: "NSW",
      numberOfKeys: 2,
      vehicleDamage: "No",
      serviceHistory: "Partial Service History",
      vehicleNotes: "N/A",
      status: "AVAILABLE",
      listedById: teslaEmployee.id,
      photos: {
        create: [
          {
            url: "https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-3-Performance-LHD.png",
            sortOrder: 0,
          },
        ],
      },
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: "notify_partners_on_new_listing",
      value: "false",
    },
  });

  return NextResponse.json({
    message: "Database seeded successfully",
    logins: {
      superAdmin: "superadmin@tesla.com / SuperAdmin123!",
      teslaEmployee: "lister@tesla.com / TeslaEmployee123!",
      partner: "partner@wholesale.com / Partner123!",
    },
  });
}
