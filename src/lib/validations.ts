import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const vehicleSchema = z.object({
  vin: z.string().min(11).max(17),
  licensePlateNumber: z.string().min(1),
  year: z.coerce.number().int(),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().min(1),
  odometer: z.coerce.number().int().min(0),
  numberOfKeys: z.coerce.number().int().min(0).max(10),
  vehicleDamage: z.enum(["Yes", "No"]),
  serviceHistory: z.enum([
    "Full Service History",
    "Partial Service History",
    "No Service History",
  ]),
  vehicleNotes: z.string().min(1),
});

export const partnerInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactPhone: z.string().optional(),
  password: z.string().min(8),
});

export const partnerUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  contactPhone: z.string().optional(),
  password: z.string().min(8).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const teslaUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
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
  sort: z.enum(["newest", "odometer_asc", "odometer_desc"]).optional(),
  page: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.number().int().min(1).optional()
  ),
});
