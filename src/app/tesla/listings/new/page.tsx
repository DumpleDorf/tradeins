"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/disclaimer";
import {
  SERVICE_HISTORY_OPTIONS,
  VEHICLE_DAMAGE_OPTIONS,
} from "@/lib/vehicle";

function formatApiError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Failed to create listing. Check all fields.";
  }

  const payload = data as { error?: unknown };
  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (payload.error && typeof payload.error === "object") {
    const flat = payload.error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
    const messages: string[] = [];

    if (flat.formErrors?.length) {
      messages.push(...flat.formErrors);
    }

    for (const [field, msgs] of Object.entries(flat.fieldErrors ?? {})) {
      if (msgs?.length) {
        messages.push(`${field}: ${msgs.join(", ")}`);
      }
    }

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Failed to create listing. Check all fields.";
}

const selectClassName =
  "flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm";

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/vehicles", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(formatApiError(data));
      setLoading(false);
      return;
    }

    if (data.photoWarnings?.length) {
      sessionStorage.setItem("listingPhotoWarning", data.photoWarnings.join(" "));
    }

    router.push(`/tesla/listings/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/tesla/listings" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to listings
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">New Vehicle Listing</h1>
        <Disclaimer variant="listing" />

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" name="vin" minLength={11} maxLength={17} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlateNumber">License Plate Number</Label>
              <Input id="licensePlateNumber" name="licensePlateNumber" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="trim">Trim</Label>
              <Input id="trim" name="trim" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input id="odometer" name="odometer" type="number" min={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfKeys">Number of Keys</Label>
              <Input id="numberOfKeys" name="numberOfKeys" type="number" min={0} max={10} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleDamage">Vehicle Damage</Label>
              <select id="vehicleDamage" name="vehicleDamage" className={selectClassName} required>
                {VEHICLE_DAMAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceHistory">Service History</Label>
              <select id="serviceHistory" name="serviceHistory" className={selectClassName} required>
                {SERVICE_HISTORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vehicleNotes">Vehicle Notes</Label>
              <textarea
                id="vehicleNotes"
                name="vehicleNotes"
                rows={4}
                required
                className="flex w-full rounded-sm border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="photos">Photos</Label>
              <Input id="photos" name="photos" type="file" accept="image/*" multiple />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Listing"}
          </Button>
        </form>
      </main>
    </div>
  );
}
