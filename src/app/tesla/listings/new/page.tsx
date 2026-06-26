"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/disclaimer";

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
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" defaultValue="Tesla" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <Input id="mileage" name="mileage" type="number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exteriorColor">Exterior Color</Label>
              <Input id="exteriorColor" name="exteriorColor" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interiorColor">Interior Color</Label>
              <Input id="interiorColor" name="interiorColor" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vin">VIN (11–17 characters)</Label>
              <Input id="vin" name="vin" minLength={11} maxLength={17} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditionGrade">Condition Grade (1–5)</Label>
              <Input id="conditionGrade" name="conditionGrade" type="number" min={1} max={5} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listPrice">List Price (AUD, indicative)</Label>
              <Input id="listPrice" name="listPrice" type="number" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="availableFrom">Available From</Label>
              <Input id="availableFrom" name="availableFrom" type="date" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description (min. 10 characters)</Label>
              <textarea
                id="description"
                name="description"
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
