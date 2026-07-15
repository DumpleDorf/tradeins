import { NextRequest, NextResponse } from "next/server";
import { Prisma, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";
import { queryVehicleBrowse } from "@/lib/vehicle-browse-query";
import { inventoryFiltersSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams);
  const params = Object.fromEntries(
    Object.entries(rawParams).filter(([, value]) => value !== "")
  );

  const parsed = inventoryFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  const statusParam = searchParams.get("status");
  let statusFilter: Prisma.VehicleWhereInput["status"] = {
    in: [VehicleStatus.RESERVED, VehicleStatus.SOLD],
  };

  if (statusParam === "RESERVED" || statusParam === "reserved") {
    statusFilter = VehicleStatus.RESERVED;
  } else if (statusParam === "SOLD" || statusParam === "sold") {
    statusFilter = VehicleStatus.SOLD;
  } else if (parsed.data.status) {
    statusFilter = parsed.data.status;
  }

  const baseWhere: Prisma.VehicleWhereInput = { status: statusFilter };
  const { status: _status, ...browseFilters } = parsed.data;

  const result = await queryVehicleBrowse(browseFilters, baseWhere, {
    status: { in: [VehicleStatus.RESERVED, VehicleStatus.SOLD] },
  });

  const vehicleIds = result.vehicles.map((vehicle) => vehicle.id);
  const reservations = await prisma.reservation.findMany({
    where: {
      vehicleId: { in: vehicleIds },
      status: "APPROVED",
    },
    orderBy: { reservedAt: "desc" },
    include: {
      partner: {
        include: { partnerProfile: true },
      },
    },
  });

  const latestByVehicle = new Map<string, (typeof reservations)[number]>();
  for (const reservation of reservations) {
    if (!latestByVehicle.has(reservation.vehicleId)) {
      latestByVehicle.set(reservation.vehicleId, reservation);
    }
  }

  return NextResponse.json({
    ...result,
    vehicles: result.vehicles.map((vehicle) => {
      const reservation = latestByVehicle.get(vehicle.id);
      return {
        ...vehicle,
        reservedAt: reservation?.reservedAt ?? null,
        notes: reservation?.notes ?? null,
        partner: reservation
          ? {
              id: reservation.partner.id,
              name: reservation.partner.name,
              email: reservation.partner.email,
              companyName: reservation.partner.partnerProfile?.companyName ?? null,
              contactName: reservation.partner.partnerProfile?.contactName ?? null,
            }
          : null,
      };
    }),
  });
}
