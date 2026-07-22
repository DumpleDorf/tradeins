import { NextResponse } from "next/server";
import { ReservationStatus, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isPartner = session.user.role === "PARTNER";
  const isTesla =
    session.user.role === "TESLA_EMPLOYEE" || session.user.role === "SUPER_ADMIN";

  if (!isPartner && !isTesla) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // My Reservations: active reserved, sold, and cancelled history.
  // Exclude stale APPROVED+AVAILABLE (not a live reservation) and other odd states.
  const statusFilter = {
    OR: [
      { status: ReservationStatus.CANCELLED },
      {
        status: ReservationStatus.APPROVED,
        vehicle: { status: { in: [VehicleStatus.RESERVED, VehicleStatus.SOLD] } },
      },
    ],
  };

  const reservations = await prisma.reservation.findMany({
    where: isPartner
      ? { partnerId: session.user.id, ...statusFilter }
      : statusFilter,
    include: {
      vehicle: {
        include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
      partner: {
        select: {
          name: true,
          email: true,
          partnerProfile: true,
        },
      },
    },
    orderBy: { reservedAt: "desc" },
  });

  return NextResponse.json(reservations);
}
