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
  "Reserving a vehicle marks your intention to buy and hides it from other wholesalers. Tesla staff will confirm the sale by marking it as sold.";

export const LISTING_DISCLAIMER =
  "Flow: Available → Reserved → Sold. A reservation is an intention to buy. Mark reserved vehicles as sold once the sale is confirmed.";
