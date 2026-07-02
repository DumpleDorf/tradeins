"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleFormFields } from "@/components/vehicle-form-fields";
import { formatApiError } from "@/lib/api-errors";
import { validateVehiclePhotoFiles } from "@/lib/vehicle-photos";

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const photoFiles = formData.getAll("photos") as File[];
    if (photoFiles.filter((f) => f.size > 0).length === 0) {
      setError("At least one photo is required.");
      setLoading(false);
      return;
    }

    const photoErrors = validateVehiclePhotoFiles(photoFiles);
    if (photoErrors.length > 0) {
      setError(photoErrors.join(" "));
      setLoading(false);
      return;
    }

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
    <PageShell>
      <LoadingOverlay show={loading} label="Creating listing..." />
      <div className="mx-auto max-w-2xl">
        <BackLink href="/tesla/listings" label="Back to listings" />
        <h1 className="mt-4 text-center text-3xl font-semibold">New Vehicle Listing</h1>
        <Disclaimer variant="listing" />

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <VehicleFormFields photosRequired />

          <div className="flex justify-center">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
