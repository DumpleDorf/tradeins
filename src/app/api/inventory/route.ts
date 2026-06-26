import { NextRequest, NextResponse } from "next/server";
import { Prisma, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inventoryFiltersSchema } from "@/lib/validations";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawParams = Object.fromEntries(new URL(request.url).searchParams);
  const params = Object.fromEntries(
    Object.entries(rawParams).filter(([, value]) => value !== "")
  );
  const parsed = inventoryFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }
  const filters = parsed.data;

  const where: Prisma.VehicleWhereInput = {
    status: VehicleStatus.AVAILABLE,
  };

  if (filters.make) where.make = { contains: filters.make, mode: "insensitive" };
  if (filters.model) where.model = { contains: filters.model, mode: "insensitive" };
  if (filters.yearMin || filters.yearMax) {
    where.year = {};
    if (filters.yearMin) where.year.gte = filters.yearMin;
    if (filters.yearMax) where.year.lte = filters.yearMax;
  }
  if (filters.odometerMin || filters.odometerMax) {
    where.odometer = {};
    if (filters.odometerMin) where.odometer.gte = filters.odometerMin;
    if (filters.odometerMax) where.odometer.lte = filters.odometerMax;
  }

  const sort = filters.sort ?? "newest";
  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    sort === "odometer_asc"
      ? { odometer: "asc" }
      : sort === "odometer_desc"
        ? { odometer: "desc" }
        : { createdAt: "desc" };

  const page = filters.page ?? 1;

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return NextResponse.json({
    vehicles,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
