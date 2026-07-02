import { NextResponse } from "next/server";
import { VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalListings,
    statusCounts,
    priceAggregate,
    odometerAggregate,
    makeBreakdown,
    reservedVehicles,
    recentListings,
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
    prisma.vehicle.aggregate({
      _avg: { odometer: true },
    }),
    prisma.vehicle.groupBy({
      by: ["make"],
      _count: { _all: true },
      orderBy: { _count: { make: "desc" } },
      take: 8,
    }),
    prisma.vehicle.findMany({
      where: {
        status: { in: [VehicleStatus.RESERVED, VehicleStatus.PENDING_APPROVAL] },
      },
      include: {
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
        reservations: {
          where: { status: "PENDING_APPROVAL" },
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
    }),
    prisma.vehicle.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count._all])
  ) as Record<string, number>;

  return NextResponse.json({
    stats: {
      totalListings,
      available: countByStatus.AVAILABLE ?? 0,
      reserved: countByStatus.RESERVED ?? 0,
      pendingApproval: countByStatus.PENDING_APPROVAL ?? 0,
      sold: countByStatus.SOLD ?? 0,
      rejected: countByStatus.REJECTED ?? 0,
      averagePrice: Math.round(priceAggregate._avg.price ?? 0),
      totalAvailableValue: priceAggregate._sum.price ?? 0,
      averageOdometer: Math.round(odometerAggregate._avg.odometer ?? 0),
      listedLast30Days: recentListings,
    },
    makeBreakdown: makeBreakdown.map((row) => ({
      make: row.make,
      count: row._count._all,
    })),
    reservedVehicles: reservedVehicles.map((vehicle) => {
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
    }),
  });
}
