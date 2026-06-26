"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { VehicleFormFields } from "@/components/vehicle-form-fields";
import { formatApiError } from "@/lib/api-errors";

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
      setError(formatApiError(data, "Failed to create listing. Check all fields."));
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

          <VehicleFormFields photosRequired={false} />

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Listing"}
          </Button>
        </form>
      </main>
    </div>
  );
}
