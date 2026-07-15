import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canReserveVehicles } from "@/lib/rbac";
import { reserveVehicleSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: vehicleId } = await context.params;
  const session = await auth();

  if (!session?.user || !canReserveVehicles(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partner = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { partnerProfile: true },
  });

  if (!partner?.partnerProfile) {
    return NextResponse.json({ error: "Wholesaler profile not found" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = reserveVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reservation request" }, { status: 400 });
  }

  const notes = parsed.data.notes?.trim() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });

      if (!vehicle || vehicle.status !== "AVAILABLE") {
        throw new Error("VEHICLE_UNAVAILABLE");
      }

      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId, status: "AVAILABLE" },
        data: { status: "RESERVED" },
      });

      const reservation = await tx.reservation.create({
        data: {
          vehicleId,
          partnerId: session.user.id,
          status: "APPROVED",
          notes,
          reviewedAt: new Date(),
        },
      });

      return { vehicle: updatedVehicle, reservation };
    });

    logAudit({
      actorId: session.user.id,
      action: "VEHICLE_RESERVED",
      entityType: "Vehicle",
      entityId: vehicleId,
      metadata: {
        vehicleId,
        vin: result.vehicle.vin,
        reservationId: result.reservation.id,
        partnerId: session.user.id,
        partnerCompany: partner.partnerProfile.companyName,
        partnerUserName: partner.name,
        partnerContactName: partner.partnerProfile.contactName,
        partnerEmail: partner.email,
        notes,
      },
    });

    return NextResponse.json(result.reservation, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "VEHICLE_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Vehicle is no longer available" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to reserve vehicle" }, { status: 500 });
  }
}
