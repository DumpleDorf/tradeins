import { NextRequest, NextResponse } from "next/server";
import { Prisma, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inventoryFiltersSchema } from "@/lib/validations";

const PAGE_SIZE = 12;

const availableWhere: Prisma.VehicleWhereInput = {
  status: VehicleStatus.AVAILABLE,
};

function buildOrderBy(sort: string): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "year_desc":
      return { year: "desc" };
    case "year_asc":
      return { year: "asc" };
    case "odometer_asc":
      return { odometer: "asc" };
    case "odometer_desc":
      return { odometer: "desc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

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
    ...availableWhere,
  };

  if (filters.make) where.make = filters.make;
  if (filters.model) where.model = filters.model;
  if (filters.vehicleDamage) where.vehicleDamage = filters.vehicleDamage;
  if (filters.serviceHistory) where.serviceHistory = filters.serviceHistory;

  if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
    where.year = {};
    if (filters.yearMin !== undefined) where.year.gte = filters.yearMin;
    if (filters.yearMax !== undefined) where.year.lte = filters.yearMax;
  }

  if (filters.odometerMin !== undefined || filters.odometerMax !== undefined) {
    where.odometer = {};
    if (filters.odometerMin !== undefined) where.odometer.gte = filters.odometerMin;
    if (filters.odometerMax !== undefined) where.odometer.lte = filters.odometerMax;
  }

  if (filters.search?.trim()) {
    const query = filters.search.trim();
    const yearMatch = /^\d{4}$/.test(query) ? Number(query) : null;
    const searchConditions: Prisma.VehicleWhereInput[] = [
      { make: { contains: query, mode: "insensitive" } },
      { model: { contains: query, mode: "insensitive" } },
      { trim: { contains: query, mode: "insensitive" } },
      { licensePlateNumber: { contains: query, mode: "insensitive" } },
    ];
    if (yearMatch !== null) {
      searchConditions.push({ year: yearMatch });
    }
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: searchConditions }];
  }

  const sort = filters.sort ?? "newest";
  const page = filters.page ?? 1;

  const [vehicles, total, bounds, makes, modelOptions, serviceHistories] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.vehicle.count({ where }),
    prisma.vehicle.aggregate({
      where: availableWhere,
      _min: { year: true, odometer: true },
      _max: { year: true, odometer: true },
    }),
    prisma.vehicle.findMany({
      where: availableWhere,
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    }),
    prisma.vehicle.findMany({
      where: availableWhere,
      select: { make: true, model: true },
      distinct: ["make", "model"],
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
    prisma.vehicle.findMany({
      where: availableWhere,
      select: { serviceHistory: true },
      distinct: ["serviceHistory"],
      orderBy: { serviceHistory: "asc" },
    }),
  ]);

  const yearMin = bounds._min.year ?? new Date().getFullYear() - 10;
  const yearMax = bounds._max.year ?? new Date().getFullYear();

  return NextResponse.json({
    vehicles,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
    meta: {
      yearMin,
      yearMax,
      odometerMin: bounds._min.odometer ?? 0,
      odometerMax: bounds._max.odometer ?? 200000,
      makes: makes.map((row) => row.make),
      modelOptions: modelOptions.map((row) => ({ make: row.make, model: row.model })),
      serviceHistories: serviceHistories.map((row) => row.serviceHistory),
    },
  });
}
