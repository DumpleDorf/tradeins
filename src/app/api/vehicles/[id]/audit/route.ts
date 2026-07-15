import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "Vehicle", entityId: id },
        {
          entityType: "Reservation",
          metadata: {
            path: ["vehicleId"],
            equals: id,
          },
        },
      ],
    },
    include: {
      actor: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
