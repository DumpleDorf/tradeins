import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
  console.error(
    "Missing POSTGRES_PRISMA_URL. Set it in your shell before running db:seed."
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const superAdminPassword = await hashPassword("SuperAdmin123!");
  const teslaPassword = await hashPassword("TeslaEmployee123!");
  const partnerPassword = await hashPassword("Partner123!");

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@tesla.com" },
    update: {},
    create: {
      email: "superadmin@tesla.com",
      name: "Super Admin",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  const teslaEmployee = await prisma.user.upsert({
    where: { email: "lister@tesla.com" },
    update: {},
    create: {
      email: "lister@tesla.com",
      name: "Tesla Lister",
      passwordHash: teslaPassword,
      role: "TESLA_EMPLOYEE",
      status: "ACTIVE",
    },
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: "partner@wholesale.com" },
    update: {},
    create: {
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

  const existingVehicle = await prisma.vehicle.findFirst({
    where: { vin: "JF1GT7KL5MG123216" },
  });

  if (!existingVehicle) {
    await prisma.vehicle.create({
      data: {
        vin: "JF1GT7KL5MG123216",
        licensePlateNumber: "319CN4",
        year: 2021,
        make: "Subaru",
        model: "Impreza",
        trim: "G5 MY21 2.0i Premium Hatchback. 5dr CVT 7sp AWD",
        odometer: 32000,
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
  }

  await prisma.systemSetting.upsert({
    where: { key: "notify_partners_on_new_listing" },
    update: {},
    create: {
      key: "notify_partners_on_new_listing",
      value: "false",
    },
  });

  console.log("Seed complete:");
  console.log("- Super Admin:", superAdmin.email, "/ SuperAdmin123!");
  console.log("- Tesla Employee:", teslaEmployee.email, "/ TeslaEmployee123!");
  console.log("- Partner:", partnerUser.email, "/ Partner123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
