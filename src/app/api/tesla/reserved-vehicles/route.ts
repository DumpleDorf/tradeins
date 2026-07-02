import { NextRequest, NextResponse } from "next/server";
import { Prisma, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filter = new URL(request.url).searchParams.get("status") ?? "reserved";

  let statusFilter: Prisma.VehicleWhereInput["status"];
  if (filter === "sold") {
    statusFilter = VehicleStatus.SOLD;
  } else if (filter === "all") {
    statusFilter = { in: [VehicleStatus.RESERVED, VehicleStatus.SOLD] };
  } else {
    statusFilter = VehicleStatus.RESERVED;
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { status: statusFilter },
    include: {
      photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      reservations: {
        where: { status: "APPROVED" },
        orderBy: { reservedAt: "desc" },
        take: 1,
        include: {
          partner: {
            include: { partnerProfile: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    vehicles.map((vehicle) => {
      const reservation = vehicle.reservations[0];
      return {
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        vin: vehicle.vin,
        licensePlateNumber: vehicle.licensePlateNumber,
        price: vehicle.price,
        status: vehicle.status,
        updatedAt: vehicle.updatedAt,
        photoUrl: vehicle.photos[0]?.url ?? null,
        reservedAt: reservation?.reservedAt ?? null,
        partner: reservation
          ? {
              name: reservation.partner.name,
              email: reservation.partner.email,
              companyName: reservation.partner.partnerProfile?.companyName ?? null,
              contactName: reservation.partner.partnerProfile?.contactName ?? null,
            }
          : null,
      };
    })
  );
}
