import { NextResponse } from "next/server";
import { ReservationStatus, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";
import { getZiplabsLastSync } from "@/lib/ziplabs-sync-store";

function mapVehicleWithPartner(
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    price: number;
    status: VehicleStatus;
    licensePlateNumber: string;
    photos: { url: string }[];
    reservations: {
      reservedAt: Date;
      partner: {
        name: string;
        email: string;
        partnerProfile: { companyName: string } | null;
      };
    }[];
  }
) {
  const reservation = vehicle.reservations[0];
  return {
    id: vehicle.id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    price: vehicle.price,
    status: vehicle.status,
    licensePlateNumber: vehicle.licensePlateNumber,
    photoUrl: vehicle.photos[0]?.url ?? null,
    reservedAt: reservation?.reservedAt ?? null,
    partner: reservation
      ? {
          name: reservation.partner.name,
          email: reservation.partner.email,
          companyName: reservation.partner.partnerProfile?.companyName ?? null,
        }
      : null,
  };
}

const vehicleWithPartnerInclude = {
  photos: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  reservations: {
    where: { status: ReservationStatus.APPROVED },
    orderBy: { reservedAt: "desc" as const },
    take: 1,
    include: {
      partner: {
        include: { partnerProfile: true },
      },
    },
  },
};

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalListings,
    statusCounts,
    priceAggregate,
    makeBreakdown,
    reservedVehicles,
    reservedVehicleIdsLast30Days,
    soldLast30Days,
    reservationCountsByPartner,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.vehicle.aggregate({
      _avg: { price: true },
      _sum: { price: true },
      where: { status: VehicleStatus.AVAILABLE, price: { gt: 0 } },
    }),
    prisma.vehicle.groupBy({
      by: ["make"],
      where: { status: VehicleStatus.AVAILABLE },
      _count: { _all: true },
      orderBy: { _count: { make: "desc" } },
      take: 8,
    }),
    prisma.vehicle.findMany({
      where: { status: VehicleStatus.RESERVED },
      include: vehicleWithPartnerInclude,
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    prisma.reservation.findMany({
      where: {
        status: ReservationStatus.APPROVED,
        reservedAt: { gte: thirtyDaysAgo },
      },
      select: { vehicleId: true },
      distinct: ["vehicleId"],
    }),
    prisma.vehicle.count({
      where: {
        status: VehicleStatus.SOLD,
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.reservation.groupBy({
      by: ["partnerId"],
      where: {
        status: {
          in: [ReservationStatus.APPROVED, ReservationStatus.PENDING_APPROVAL],
        },
      },
      _count: { _all: true },
      orderBy: { _count: { partnerId: "desc" } },
    }),
  ]);

  const partnerIds = reservationCountsByPartner.map((row) => row.partnerId);
  const partners =
    partnerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: partnerIds } },
          select: {
            id: true,
            name: true,
            partnerProfile: { select: { companyName: true } },
          },
        })
      : [];
  const partnerById = new Map(partners.map((partner) => [partner.id, partner]));

  const reservationsByWholesaler = reservationCountsByPartner.map((row) => {
    const partner = partnerById.get(row.partnerId);
    return {
      companyName:
        partner?.partnerProfile?.companyName?.trim() ||
        partner?.name?.trim() ||
        "Unknown wholesaler",
      count: row._count._all,
    };
  });

  // Merge rows that share the same company name (multiple logins under one company).
  const wholesalerTotals = new Map<string, number>();
  for (const row of reservationsByWholesaler) {
    wholesalerTotals.set(row.companyName, (wholesalerTotals.get(row.companyName) ?? 0) + row.count);
  }
  const reservationsByWholesalerMerged = [...wholesalerTotals.entries()]
    .map(([companyName, count]) => ({ companyName, count }))
    .sort((a, b) => b.count - a.count || a.companyName.localeCompare(b.companyName));

  const countByStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count._all])
  ) as Record<string, number>;

  const ziplabsLastSync = await getZiplabsLastSync();

  return NextResponse.json({
    stats: {
      totalListings,
      available: countByStatus.AVAILABLE ?? 0,
      reserved: countByStatus.RESERVED ?? 0,
      sold: countByStatus.SOLD ?? 0,
      rejected: countByStatus.REJECTED ?? 0,
      averagePrice: Math.round(priceAggregate._avg.price ?? 0),
      totalAvailableValue: priceAggregate._sum.price ?? 0,
      reservedLast30Days: reservedVehicleIdsLast30Days.length,
      soldLast30Days,
    },
    makeBreakdown: makeBreakdown.map((row) => ({
      make: row.make,
      count: row._count._all,
    })),
    reservationsByWholesaler: reservationsByWholesalerMerged,
    reservedVehicles: reservedVehicles.map(mapVehicleWithPartner),
    ziplabsLastSync,
  });
}
