import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOdometer(odometer: number) {
  return new Intl.NumberFormat("en-AU").format(odometer) + " km";
}

/** @deprecated Use formatOdometer */
export function formatMileage(mileage: number) {
  return formatOdometer(mileage);
}

export const DISCLAIMER =
  "Purchasing a vehicle reserves it under your company and hides it from other suppliers. Contact Tesla to finalize the sale.";

export const LISTING_DISCLAIMER =
  "Reserved vehicles are held for the purchasing partner. Mark vehicles as sold once the sale is complete.";
