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

  const [available, reserved, sold] = await Promise.all([
    prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.RESERVED } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.SOLD } }),
  ]);

  return NextResponse.json({
    available,
    reservationRequests: reserved,
    sold,
  });
}
