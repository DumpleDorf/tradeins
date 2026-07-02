import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { z } from "zod";
import type { inventoryFiltersSchema } from "@/lib/validations";

export const VEHICLE_BROWSE_PAGE_SIZE = 12;

export type VehicleBrowseFilters = z.infer<typeof inventoryFiltersSchema>;

export function buildVehicleBrowseOrderBy(
  sort: string
): Prisma.VehicleOrderByWithRelationInput {
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

export function buildVehicleBrowseWhere(
  filters: VehicleBrowseFilters,
  baseWhere: Prisma.VehicleWhereInput
): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = { ...baseWhere };

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
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: searchConditions },
    ];
  }

  return where;
}

export async function queryVehicleBrowse(
  filters: VehicleBrowseFilters,
  baseWhere: Prisma.VehicleWhereInput,
  metaWhere: Prisma.VehicleWhereInput
) {
  const where = buildVehicleBrowseWhere(filters, baseWhere);
  const sort = filters.sort ?? "newest";
  const page = filters.page ?? 1;

  const [vehicles, total, bounds, makes, modelOptions, serviceHistories] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: buildVehicleBrowseOrderBy(sort),
      skip: (page - 1) * VEHICLE_BROWSE_PAGE_SIZE,
      take: VEHICLE_BROWSE_PAGE_SIZE,
    }),
    prisma.vehicle.count({ where }),
    prisma.vehicle.aggregate({
      where: metaWhere,
      _min: { year: true, odometer: true },
      _max: { year: true, odometer: true },
    }),
    prisma.vehicle.findMany({
      where: metaWhere,
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    }),
    prisma.vehicle.findMany({
      where: metaWhere,
      select: { make: true, model: true },
      distinct: ["make", "model"],
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
    prisma.vehicle.findMany({
      where: metaWhere,
      select: { serviceHistory: true },
      distinct: ["serviceHistory"],
      orderBy: { serviceHistory: "asc" },
    }),
  ]);

  const yearMin = bounds._min.year ?? new Date().getFullYear() - 10;
  const yearMax = bounds._max.year ?? new Date().getFullYear();

  return {
    vehicles,
    pagination: {
      page,
      pageSize: VEHICLE_BROWSE_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / VEHICLE_BROWSE_PAGE_SIZE),
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
  };
}
