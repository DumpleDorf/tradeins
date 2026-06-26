import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canApproveReservations } from "@/lib/rbac";
import { rejectSchema } from "@/lib/validations";
import {
  sendApprovalNotification,
  sendRejectionNotification,
} from "@/lib/email";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canApproveReservations(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action as "approve" | "reject";

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      vehicle: true,
      partner: { include: { partnerProfile: true } },
    },
  });

  if (!reservation || reservation.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const vehicleLabel = `${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`;

  if (action === "approve") {
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date() },
      });

      await tx.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: "SOLD" },
      });

      return res;
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "RESERVATION_APPROVED",
      entityType: "Reservation",
      entityId: id,
    });

    await sendApprovalNotification({
      to: reservation.partner.email,
      partnerName: reservation.partner.partnerProfile?.contactName ?? reservation.partner.name,
      vehicleLabel,
      vin: reservation.vehicle.vin,
    });

    return NextResponse.json(updated);
  }

  if (action === "reject") {
    const parsed = rejectSchema.safeParse({ reason: body.reason });
    if (!parsed.success) {
      return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: parsed.data.reason,
          reviewedAt: new Date(),
        },
      });

      await tx.vehicle.update({
        where: { id: reservation.vehicleId },
        data: {
          status: "AVAILABLE",
          rejectionReason: parsed.data.reason,
        },
      });

      return res;
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "RESERVATION_REJECTED",
      entityType: "Reservation",
      entityId: id,
      metadata: { reason: parsed.data.reason },
    });

    await sendRejectionNotification({
      to: reservation.partner.email,
      partnerName: reservation.partner.partnerProfile?.contactName ?? reservation.partner.name,
      vehicleLabel,
      vin: reservation.vehicle.vin,
      reason: parsed.data.reason,
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
