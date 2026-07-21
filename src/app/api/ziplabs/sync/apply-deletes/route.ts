import { NextRequest, NextResponse } from "next/server";
import { VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";

/** Delete AVAILABLE listings that are no longer on the ZipLabs report. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { rnNumbers?: string[] } | null;
  const rnNumbers = Array.isArray(body?.rnNumbers)
    ? [...new Set(body.rnNumbers.map((rn) => rn.trim().toUpperCase()).filter(Boolean))]
    : [];

  if (rnNumbers.length === 0) {
    return NextResponse.json({ deleted: [] });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      id: { in: rnNumbers },
      status: VehicleStatus.AVAILABLE,
    },
    select: { id: true, make: true, model: true, year: true, status: true },
  });

  const deleted: typeof vehicles = [];

  for (const vehicle of vehicles) {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({ where: { vehicleId: vehicle.id } });
      await tx.vehiclePhoto.deleteMany({ where: { vehicleId: vehicle.id } });
      await tx.vehicle.delete({ where: { id: vehicle.id } });
    });
    deleted.push(vehicle);
    logAudit({
      actorId: session.user.id,
      action: "VEHICLE_DELETED",
      entityType: "Vehicle",
      entityId: vehicle.id,
      metadata: { source: "ziplabs_sync", reason: "AVAILABLE but not on ZipLabs report" },
    });
  }

  return NextResponse.json({
    deleted: deleted.map((vehicle) => ({
      rnNumber: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    })),
  });
}
