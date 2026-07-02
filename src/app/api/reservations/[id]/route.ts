import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      vehicle: {
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPartner = session.user.role === "PARTNER";
  const isTesla =
    session.user.role === "TESLA_EMPLOYEE" || session.user.role === "SUPER_ADMIN";

  if (isPartner && reservation.partnerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isPartner && !isTesla) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ...reservation,
    vehicle: {
      ...reservation.vehicle,
      status: reservation.vehicle.status,
    },
  });
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Reservation approval has been removed. Mark vehicles as sold from the listing or reserved vehicles page." },
    { status: 410 }
  );
}
