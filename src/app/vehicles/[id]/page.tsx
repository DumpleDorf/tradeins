"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingOverlay } from "@/components/loading-overlay";
import { PhotoGallery } from "@/components/photo-gallery";
import { Button } from "@/components/ui/button";
import { getVehicleDetailRows, formatVehiclePrice, type VehicleDetails } from "@/lib/vehicle";

type Vehicle = VehicleDetails & {
  id: string;
  photos: { url: string }[];
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicle(data);
        setLoading(false);
      });
  }, [id]);

  async function handleReserve() {
    setReserving(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}/reserve`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to reserve vehicle");
      setReserving(false);
      return;
    }

    router.push("/reservations");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingOverlay show label="Loading vehicle..." />
        <Header />
      </div>
    );
  }

  if (!vehicle?.id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16">Vehicle not found.</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LoadingOverlay show={reserving} label="Reserving vehicle..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Disclaimer />

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <PhotoGallery photos={vehicle.photos} />

          <div className="space-y-6 animate-slide-up">
            <div>
              <h1 className="text-3xl font-semibold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.price > 0 && (
                <p className="mt-2 text-2xl font-semibold">{formatVehiclePrice(vehicle.price)}</p>
              )}
            </div>

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

            {!showConfirm ? (
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setShowConfirm(true)}>
                Reserve This Vehicle
              </Button>
            ) : (
              <div className="rounded-sm border border-border bg-card p-4 space-y-4">
                <p className="text-sm">
                  Confirm your intent to purchase this vehicle. It will be immediately
                  reserved and hidden from other partners. Tesla will review your
                  reservation.
                </p>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleReserve} disabled={reserving}>
                    {reserving ? "Reserving..." : "Confirm Reservation"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
