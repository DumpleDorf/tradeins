import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/** ZipLabs/AMP acquisition RN used as Vehicle.id primary key. */
export const rnNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^RN\d+$/, "Vehicle RN must look like RN126870852");

export const vehicleSchema = z.object({
  id: rnNumberSchema,
  vin: z.string().min(11).max(17),
  licensePlateNumber: z.string().min(1),
  year: z.coerce.number().int(),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().min(1),
  odometer: z.coerce.number().int().min(0),
  price: z.coerce.number().int().min(0),
  site: z.string().min(1),
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  numberOfKeys: z.coerce.number().int().min(0).max(10),
  vehicleDamage: z.enum(["Yes", "No"]),
  serviceHistory: z.enum([
    "Full Service History",
    "Partial Service History",
    "Electronic Service History",
    "No Service History",
  ]),
  vehicleNotes: z.string().optional().default(""),
});

export const partnerInviteSchema = z.object({
  email: z.string().email(),
  companyName: z.string().min(1),
  /** Kept for DB compatibility; UI no longer collects a person name. */
  name: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  password: z.string().min(8),
});

export const partnerUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  password: z.string().min(8).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const teslaUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
});

export const adminUserUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const rejectSchema = z.object({
  reason: z.string().min(1).max(1000),
});

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.number().optional()
);

export const inventoryFiltersSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: optionalNumber,
  yearMax: optionalNumber,
  odometerMin: optionalNumber,
  odometerMax: optionalNumber,
  vehicleDamage: z.enum(["Yes", "No"]).optional(),
  serviceHistory: z
    .enum([
      "Full Service History",
      "Partial Service History",
      "Electronic Service History",
      "No Service History",
    ])
    .optional(),
  state: z.string().optional(),
  status: z.preprocess(
    (value) => (value === "" || value === "ALL" || value === null ? undefined : value),
    z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional()
  ),
  search: z.string().optional(),

  sort: z
    .enum([
      "newest",
      "oldest",
      "year_desc",
      "year_asc",
      "odometer_asc",
      "odometer_desc",
      "price_asc",
      "price_desc",
    ])
    .optional(),
  page: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.number().int().min(1).optional()
  ),
});

export const vehicleStatusChangeSchema = z.object({
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
  partnerId: z.string().optional(),
  comment: z.string().max(2000).optional(),
});

export const reserveVehicleSchema = z.object({
  notes: z.string().max(2000).optional(),
});
