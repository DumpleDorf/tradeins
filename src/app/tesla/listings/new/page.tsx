"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/loading-overlay";
import {
  ListingPhotoUpload,
  type UploadPhoto,
} from "@/components/listing-photo-manager";
import {
  RequiredAsterisk,
  RequiredFieldsHint,
  VehicleFormFields,
} from "@/components/vehicle-form-fields";
import { formatApiError } from "@/lib/api-errors";
import { validateVehiclePhotoFiles } from "@/lib/vehicle-photos";

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<UploadPhoto[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const photoFiles = photos.map((photo) => photo.file);
    if (photoFiles.length === 0) {
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

    const formData = new FormData(e.currentTarget);
    photoFiles.forEach((file) => formData.append("photos", file));

    try {
      const res = await fetch("/api/vehicles", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(formatApiError(data, "Failed to create listing. Check all fields."));
        setLoading(false);
        return;
      }

      if (data?.photoWarnings?.length) {
        sessionStorage.setItem("listingPhotoWarning", data.photoWarnings.join(" "));
      }

      router.push(`/tesla/listings/${data.id}`);
    } catch {
      setError("Failed to create listing. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <LoadingOverlay
        show={loading}
        label={
          photos.length > 0
            ? `Creating listing and uploading ${photos.length} photo${photos.length === 1 ? "" : "s"}…`
            : "Creating listing..."
        }
      />
      <div className="mx-auto max-w-2xl">
        <BackLink href="/tesla/listings" label="Back to listings" />
        <h1 className="mt-4 text-center text-3xl font-semibold">New Vehicle Listing</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <RequiredFieldsHint />
          {error && <p className="text-sm text-red-400">{error}</p>}

          <VehicleFormFields showPhotos={false} />

          <ListingPhotoUpload
            photos={photos}
            onChange={setPhotos}
            label={
              <>
                Photos <RequiredAsterisk />
              </>
            }
          />

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
