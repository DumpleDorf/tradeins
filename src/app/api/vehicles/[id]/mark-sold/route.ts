import { NextRequest, NextResponse } from "next/server";
import { VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: { reservedAt: "desc" },
        take: 1,
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
    },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (vehicle.status !== VehicleStatus.RESERVED) {
    return NextResponse.json(
      { error: "Only reserved vehicles can be marked as sold" },
      { status: 400 }
    );
  }

  const body = await _request.json().catch(() => ({}));
  const comment =
    typeof body?.comment === "string" && body.comment.trim()
      ? body.comment.trim()
      : null;

  const updated = await prisma.vehicle.update({
    where: { id },
    data: { status: VehicleStatus.SOLD },
  });

  const partner = vehicle.reservations[0]?.partner;

  logAudit({
    actorId: session.user.id,
    action: "VEHICLE_MARKED_SOLD",
    entityType: "Vehicle",
    entityId: id,
    metadata: {
      vin: vehicle.vin,
      comment,
      partnerId: partner?.id ?? null,
      partnerCompany: partner?.partnerProfile?.companyName ?? null,
      partnerUserName: partner?.name ?? null,
      partnerContactName: partner?.partnerProfile?.contactName ?? null,
      partnerEmail: partner?.email ?? null,
    },
  });

  return NextResponse.json(updated);
}
