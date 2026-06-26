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

export function formatMileage(mileage: number) {
  return new Intl.NumberFormat("en-AU").format(mileage) + " km";
}

export const DISCLAIMER =
  "All reservations are subject to final approval by Tesla. No sale is confirmed until you receive written confirmation from Tesla.";

export const LISTING_DISCLAIMER =
  "No sales are final until approved by Tesla.";
