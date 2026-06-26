"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Disclaimer, StatusBadge } from "@/components/disclaimer";
import { PhotoGallery } from "@/components/photo-gallery";
import { VehicleFormFields } from "@/components/vehicle-form-fields";
import { VehicleImage } from "@/components/vehicle-image";
import { Button } from "@/components/ui/button";
import { getVehicleDetailRows, type VehicleDetails } from "@/lib/vehicle";
import { formatApiError } from "@/lib/api-errors";
import { validateVehiclePhotoFiles } from "@/lib/vehicle-photos";

type VehiclePhoto = {
  id: string;
  url: string;
};

type Vehicle = VehicleDetails & {
  id: string;
  status: string;
  photos: VehiclePhoto[];
  listedBy: { name: string };
};

const NON_EDITABLE_STATUSES = ["PENDING_APPROVAL", "SOLD"];

export default function TeslaListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [photoWarning, setPhotoWarning] = useState("");
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);

  useEffect(() => {
    const warning = sessionStorage.getItem("listingPhotoWarning");
    if (warning) {
      setPhotoWarning(warning);
      sessionStorage.removeItem("listingPhotoWarning");
    }
  }, []);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicle(data);
        setLoading(false);
      });
  }, [id]);

  const canEdit = vehicle && !NON_EDITABLE_STATUSES.includes(vehicle.status);
  const canDelete = canEdit;

  function cancelEdit() {
    setEditing(false);
    setPhotosToRemove([]);
    setError("");
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    photosToRemove.forEach((photoId) => formData.append("removePhotoIds", photoId));

    const photoFiles = formData.getAll("photos") as File[];
    const photoErrors = validateVehiclePhotoFiles(photoFiles);
    if (photoErrors.length > 0) {
      setError(photoErrors.join(" "));
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setError(formatApiError(data, "Failed to update listing."));
      setSaving(false);
      return;
    }

    setVehicle(data);
    setEditing(false);
    setPhotosToRemove([]);
    setSaving(false);

    if (data.photoWarnings?.length) {
      setPhotoWarning(data.photoWarnings.join(" "));
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to remove listing");
      setRemoving(false);
      return;
    }

    router.push("/tesla/listings");
    router.refresh();
  }

  const visiblePhotos =
    vehicle?.photos.filter((photo) => !photosToRemove.includes(photo.id)) ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 text-muted-foreground">Loading...</main>
      </div>
    );
  }

  if (!vehicle?.id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16">
          <p>Listing not found.</p>
          <Link href="/tesla/listings" className="text-tesla-red hover:underline">
            Back to listings
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/tesla/listings" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to listings
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <StatusBadge status={vehicle.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              VIN: {vehicle.vin} · Listed by {vehicle.listedBy.name}
            </p>
          </div>
          {canEdit && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit listing
            </Button>
          )}
        </div>

        <Disclaimer variant="listing" />

        {photoWarning && (
          <p className="mt-4 rounded-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Listing saved, but photos could not be uploaded: {photoWarning}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {editing ? (
          <form onSubmit={handleEditSubmit} className="mt-8 max-w-2xl space-y-6">
            <VehicleFormFields defaultValues={vehicle} idPrefix="edit-" showPhotos />

            <div className="space-y-3 rounded-sm border border-border bg-card p-4">
              <h2 className="font-semibold">Current photos</h2>
              {visiblePhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No photos on this listing.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visiblePhotos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-muted">
                        <VehicleImage
                          src={photo.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setPhotosToRemove((ids) => [...ids, photo.id])}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {photosToRemove.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {photosToRemove.length} photo(s) will be removed when you save.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <PhotoGallery photos={vehicle.photos} />

            <div className="space-y-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {getVehicleDetailRows(vehicle).map(([label, value]) => (
                  <div key={label} className={label === "Trim" ? "col-span-2" : undefined}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h2 className="mb-2 font-semibold">Vehicle Notes</h2>
                <p className="text-muted-foreground">{vehicle.vehicleNotes}</p>
              </div>

              <div className="rounded-sm border border-border bg-card p-4 space-y-4">
                <h2 className="font-semibold">Manage listing</h2>

                {!canDelete && (
                  <p className="text-sm text-muted-foreground">
                    This listing cannot be edited or removed while it is{" "}
                    {vehicle.status.replace(/_/g, " ").toLowerCase()}.{" "}
                    {vehicle.status === "PENDING_APPROVAL" && (
                      <Link href="/tesla/reservations" className="text-tesla-red hover:underline">
                        Review the reservation first
                      </Link>
                    )}
                  </p>
                )}

                {canDelete && !showConfirm && (
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      Edit listing
                    </Button>
                    <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                      Remove listing
                    </Button>
                  </div>
                )}

                {canDelete && showConfirm && (
                  <div className="space-y-3">
                    <p className="text-sm">
                      Remove this listing permanently? It will be deleted from partner inventory
                      and cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="destructive" onClick={handleRemove} disabled={removing}>
                        {removing ? "Removing..." : "Confirm remove"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
