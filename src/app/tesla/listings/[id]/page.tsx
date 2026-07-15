"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { VehicleDetailContent } from "@/components/vehicle-detail-content";
import { ListingPhotoManager, type ManagedPhoto } from "@/components/listing-photo-manager";
import { BackLink } from "@/components/back-link";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleFormFields } from "@/components/vehicle-form-fields";
import { Button } from "@/components/ui/button";
import { formatApiError } from "@/lib/api-errors";
import { validateVehiclePhotoFiles } from "@/lib/vehicle-photos";
import { type VehicleDetails } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

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

const NON_EDITABLE_STATUSES = ["RESERVED", "SOLD"];

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
  const [orderedPhotos, setOrderedPhotos] = useState<ManagedPhoto[]>([]);
  const [markingSold, setMarkingSold] = useState(false);

  useEffect(() => {
    const warning = sessionStorage.getItem("listingPhotoWarning");
    if (warning) {
      setPhotoWarning(warning);
      sessionStorage.removeItem("listingPhotoWarning");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vehicles/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!cancelled) {
          setVehicle(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!vehicle) return;
    setOrderedPhotos(
      vehicle.photos
        .filter((photo) => !photosToRemove.includes(photo.id))
        .map((photo) => ({ id: photo.id, url: photo.url }))
    );
  }, [vehicle, photosToRemove]);

  const canEdit = vehicle && !NON_EDITABLE_STATUSES.includes(vehicle.status);
  const canDelete = canEdit;
  const canMarkSold = vehicle?.status === "RESERVED";

  function cancelEdit() {
    setEditing(false);
    setPhotosToRemove([]);
    setError("");
  }

  function startEdit() {
    if (!vehicle) return;
    setOrderedPhotos(vehicle.photos.map((photo) => ({ id: photo.id, url: photo.url })));
    setPhotosToRemove([]);
    setEditing(true);
  }

  function handleRemovePhoto(photoId: string) {
    setPhotosToRemove((ids) => [...ids, photoId]);
    setOrderedPhotos((photos) => photos.filter((photo) => photo.id !== photoId));
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    photosToRemove.forEach((photoId) => formData.append("removePhotoIds", photoId));
    orderedPhotos.forEach((photo) => formData.append("photoOrder", photo.id));

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

  async function handleMarkSold() {
    setMarkingSold(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}/mark-sold`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to mark vehicle as sold");
      setMarkingSold(false);
      return;
    }

    setVehicle((current) => (current ? { ...current, status: "SOLD" } : current));
    setMarkingSold(false);
  }

  if (loading) {
    return (
      <PageShell>
        <LoadingOverlay show label="Loading listing..." />
      </PageShell>
    );
  }

  if (!vehicle?.id) {
    return (
      <PageShell>
        <main className="mx-auto max-w-3xl py-16 text-center">
          <p>Listing not found.</p>
          <BackLink href="/tesla/listings" label="Back to listings" className="mt-4" />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <LoadingOverlay
        show={saving || removing || markingSold}
        label={removing ? "Removing listing..." : markingSold ? "Marking as sold..." : "Saving changes..."}
      />

      <BackLink href="/tesla/listings" label="Back to listings" />

      <div className={cn("mt-6", editing && "mx-auto max-w-2xl")}>
        <Disclaimer variant="listing" />

        {photoWarning && (
          <p className="mt-4 rounded-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Listing saved, but photos could not be uploaded: {photoWarning}
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {editing ? (
          <form onSubmit={handleEditSubmit} className="mt-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-semibold">
                Edit {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
            </div>

            <VehicleFormFields defaultValues={vehicle} idPrefix="edit-" showPhotos />

            <div className="space-y-3 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
              <h2 className="font-semibold">Photos</h2>
              <ListingPhotoManager
                photos={orderedPhotos}
                onChange={setOrderedPhotos}
                onRemove={handleRemovePhoto}
              />
              {photosToRemove.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {photosToRemove.length} photo(s) will be removed when you save.
                </p>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-8 animate-slide-up">
            <VehicleDetailContent
              vehicle={vehicle}
              subtitle={`VIN: ${vehicle.vin}`}
              actions={
                <>
                  {canEdit && (
                    <Button variant="outline" onClick={startEdit}>
                      Edit listing
                    </Button>
                  )}
                  {canMarkSold && (
                    <Button onClick={handleMarkSold} disabled={markingSold}>
                      Mark as sold
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                      Remove listing
                    </Button>
                  )}
                </>
              }
              sidebar={
                showConfirm ? (
                  <div className="space-y-3 rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
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
                ) : vehicle.status === "RESERVED" ? (
                  <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                    <h2 className="mb-2 font-semibold">Reserved vehicle</h2>
                    <p className="text-sm text-muted-foreground">
                      This vehicle has been purchased by a partner and is hidden from supplier
                      inventory. Mark it as sold once the sale is complete.
                    </p>
                  </div>
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
