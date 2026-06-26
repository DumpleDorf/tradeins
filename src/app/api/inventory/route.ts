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

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = inventoryFiltersSchema.parse(params);

  const where: Prisma.VehicleWhereInput = {
    status: VehicleStatus.AVAILABLE,
  };

  if (filters.make) where.make = { equals: filters.make, mode: "insensitive" };
  if (filters.model) where.model = { contains: filters.model, mode: "insensitive" };
  if (filters.yearMin || filters.yearMax) {
    where.year = {};
    if (filters.yearMin) where.year.gte = filters.yearMin;
    if (filters.yearMax) where.year.lte = filters.yearMax;
  }
  if (filters.mileageMin || filters.mileageMax) {
    where.mileage = {};
    if (filters.mileageMin) where.mileage.gte = filters.mileageMin;
    if (filters.mileageMax) where.mileage.lte = filters.mileageMax;
  }
  if (filters.conditionGrade) where.conditionGrade = filters.conditionGrade;
  if (filters.priceMin || filters.priceMax) {
    where.listPrice = {};
    if (filters.priceMin) where.listPrice.gte = filters.priceMin;
    if (filters.priceMax) where.listPrice.lte = filters.priceMax;
  }

  const sort = filters.sort ?? "newest";
  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    sort === "price_asc"
      ? { listPrice: "asc" }
      : sort === "price_desc"
        ? { listPrice: "desc" }
        : sort === "mileage"
          ? { mileage: "asc" }
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
