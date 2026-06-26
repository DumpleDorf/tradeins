import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int(),
  mileage: z.coerce.number().int().min(0),
  exteriorColor: z.string().min(1),
  interiorColor: z.string().min(1),
  vin: z.string().min(11).max(17),
  conditionGrade: z.coerce.number().int().min(1).max(5),
  listPrice: z.coerce.number().positive(),
  description: z.string().min(10),
  availableFrom: z.string().min(1),
});

export const partnerInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactPhone: z.string().optional(),
});

export const teslaUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
});

export const rejectSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const inventoryFiltersSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  mileageMin: z.coerce.number().optional(),
  mileageMax: z.coerce.number().optional(),
  conditionGrade: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "mileage"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});
