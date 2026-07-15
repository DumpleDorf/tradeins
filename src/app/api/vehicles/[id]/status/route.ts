import { NextRequest, NextResponse } from "next/server";
import { ReservationStatus, UserRole, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { vehicleStatusChangeSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

const vehicleInclude = {
  photos: { orderBy: { sortOrder: "asc" as const } },
  listedBy: { select: { name: true } },
  reservations: {
    orderBy: { reservedAt: "desc" as const },
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          email: true,
          partnerProfile: { select: { companyName: true, contactName: true } },
        },
      },
    },
  },
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = vehicleStatusChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status change request" }, { status: 400 });
  }

  const { status, partnerId, comment } = parsed.data;
  const needsPartner = status === "RESERVED" || status === "SOLD";

  if (needsPartner && !partnerId) {
    return NextResponse.json(
      { error: "Select a wholesaler when moving to Reserved or Sold" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (vehicle.status === status) {
    return NextResponse.json({ error: "Vehicle is already in that status" }, { status: 400 });
  }

  let partnerCompany: string | null = null;
  if (needsPartner && partnerId) {
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      include: { partnerProfile: true },
    });
    if (!partner || partner.role !== UserRole.PARTNER || !partner.partnerProfile) {
      return NextResponse.json({ error: "Invalid wholesaler selected" }, { status: 400 });
    }
    partnerCompany = partner.partnerProfile.companyName;
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id },
        data: { status: status as VehicleStatus },
      });

      if (needsPartner && partnerId) {
        await tx.reservation.create({
          data: {
            vehicleId: id,
            partnerId,
            status: ReservationStatus.APPROVED,
            notes: comment?.trim() || null,
            reviewedAt: new Date(),
          },
        });
      }

      return tx.vehicle.findUniqueOrThrow({
        where: { id },
        include: vehicleInclude,
      });
    });

    logAudit({
      actorId: session.user.id,
      action: "VEHICLE_STATUS_CHANGED",
      entityType: "Vehicle",
      entityId: id,
      metadata: {
        vin: vehicle.vin,
        fromStatus: vehicle.status,
        toStatus: status,
        partnerId: partnerId ?? null,
        partnerCompany,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Vehicle status change failed:", error);
    return NextResponse.json({ error: "Failed to update vehicle status" }, { status: 500 });
  }
}
