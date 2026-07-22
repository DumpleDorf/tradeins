import { NextRequest, NextResponse } from "next/server";
import { ReservationStatus, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings, canReserveVehicles } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Partner: cancel own reservation → vehicle AVAILABLE, reservation CANCELLED.
 * Tesla/admin: also allowed (same outcome as release/re-list).
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isPartner = canReserveVehicles(session.user);
  const isTesla = canManageListings(session.user);

  if (!isPartner && !isTesla) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      vehicle: true,
      partner: {
        include: { partnerProfile: true },
      },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isPartner && reservation.partnerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.status !== ReservationStatus.APPROVED) {
    return NextResponse.json(
      { error: "Only an active reservation can be released" },
      { status: 400 }
    );
  }

  if (reservation.vehicle.status !== VehicleStatus.RESERVED) {
    return NextResponse.json(
      {
        error:
          reservation.vehicle.status === VehicleStatus.SOLD
            ? "This vehicle has already been marked sold"
            : "Vehicle is not currently reserved",
      },
      { status: 409 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: { id: reservation.vehicleId, status: VehicleStatus.RESERVED },
        data: { status: VehicleStatus.AVAILABLE },
      });

      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CANCELLED,
          reviewedAt: new Date(),
          rejectionReason: isPartner
            ? "Released by wholesaler"
            : "Released by Tesla staff",
        },
      });

      return { vehicle, reservation: updatedReservation };
    });

    logAudit({
      actorId: session.user.id,
      action: "RESERVATION_CANCELLED",
      entityType: "Vehicle",
      entityId: reservation.vehicleId,
      metadata: {
        vehicleId: reservation.vehicleId,
        vin: reservation.vehicle.vin,
        reservationId: reservation.id,
        fromStatus: VehicleStatus.RESERVED,
        toStatus: VehicleStatus.AVAILABLE,
        partnerId: reservation.partnerId,
        partnerCompany: reservation.partner.partnerProfile?.companyName ?? null,
        partnerUserName: reservation.partner.name,
        partnerContactName: reservation.partner.partnerProfile?.contactName ?? null,
        partnerEmail: reservation.partner.email,
        cancelledByRole: session.user.role,
      },
    });

    return NextResponse.json(result.reservation);
  } catch {
    return NextResponse.json(
      { error: "Failed to release reservation" },
      { status: 500 }
    );
  }
}
