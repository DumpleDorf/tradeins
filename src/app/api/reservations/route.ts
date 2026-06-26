import { NextResponse } from "next/server";
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

  const reservations = await prisma.reservation.findMany({
    where: isPartner ? { partnerId: session.user.id } : undefined,
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
