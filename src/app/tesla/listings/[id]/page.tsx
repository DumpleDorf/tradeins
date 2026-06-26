"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Disclaimer, StatusBadge } from "@/components/disclaimer";
import { PhotoGallery } from "@/components/photo-gallery";
import { Button } from "@/components/ui/button";
import { formatMileage, formatPrice } from "@/lib/utils";

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  conditionGrade: number;
  listPrice: string;
  description: string;
  availableFrom: string;
  status: string;
  photos: { url: string }[];
  listedBy: { name: string };
};

const NON_DELETABLE_STATUSES = ["PENDING_APPROVAL", "SOLD"];

export default function TeslaListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [photoWarning, setPhotoWarning] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  async function handlePhotoUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadingPhotos(true);
    setPhotoWarning("");
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to upload photos");
      setUploadingPhotos(false);
      return;
    }

    const updated = await fetch(`/api/vehicles/${id}`).then((r) => r.json());
    setVehicle(updated);
    setUploadingPhotos(false);
    (e.target as HTMLFormElement).reset();
  }

  const canDelete = vehicle && !NON_DELETABLE_STATUSES.includes(vehicle.status);

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
        </div>

        <Disclaimer variant="listing" />

        {photoWarning && (
          <p className="mt-4 rounded-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Listing saved, but photos could not be uploaded: {photoWarning}
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <PhotoGallery photos={vehicle.photos} />

          <div className="space-y-6">
            <p className="text-2xl font-semibold text-tesla-red">
              {formatPrice(vehicle.listPrice)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">indicative</span>
            </p>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Mileage", formatMileage(vehicle.mileage)],
                ["Condition", `Grade ${vehicle.conditionGrade}/5`],
                ["Exterior", vehicle.exteriorColor],
                ["Interior", vehicle.interiorColor],
                ["Available from", new Date(vehicle.availableFrom).toLocaleDateString("en-AU")],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h2 className="mb-2 font-semibold">Description</h2>
              <p className="text-muted-foreground">{vehicle.description}</p>
            </div>

            <div className="rounded-sm border border-border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Photos</h2>
              <form onSubmit={handlePhotoUpload} className="space-y-3">
                <input
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-sm file:border-0 file:bg-tesla-red file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <Button type="submit" variant="outline" disabled={uploadingPhotos}>
                  {uploadingPhotos ? "Uploading..." : "Upload photos"}
                </Button>
              </form>
            </div>

            <div className="rounded-sm border border-border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Manage listing</h2>

              {!canDelete && (
                <p className="text-sm text-muted-foreground">
                  This listing cannot be removed while it is{" "}
                  {vehicle.status.replace(/_/g, " ").toLowerCase()}.{" "}
                  {vehicle.status === "PENDING_APPROVAL" && (
                    <Link href="/tesla/reservations" className="text-tesla-red hover:underline">
                      Review the reservation first
                    </Link>
                  )}
                </p>
              )}

              {canDelete && !showConfirm && (
                <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                  Remove listing
                </Button>
              )}

              {canDelete && showConfirm && (
                <div className="space-y-3">
                  <p className="text-sm">
                    Remove this listing permanently? It will be deleted from partner inventory
                    and cannot be undone.
                  </p>
                  {error && <p className="text-sm text-red-400">{error}</p>}
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
      </main>
    </div>
  );
}
