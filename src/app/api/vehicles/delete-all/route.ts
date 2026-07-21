import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

/** SUPER_ADMIN debug helper — permanently deletes every vehicle listing. */
export async function POST() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.reservation.deleteMany();
    const photos = await tx.vehiclePhoto.deleteMany();
    const vehicles = await tx.vehicle.deleteMany();
    return { vehicles: vehicles.count, photos: photos.count };
  });

  logAudit({
    actorId: session.user.id,
    action: "VEHICLES_DELETE_ALL",
    entityType: "Vehicle",
    entityId: "ALL",
    metadata: deleted,
  });

  return NextResponse.json({ ok: true, ...deleted });
}
