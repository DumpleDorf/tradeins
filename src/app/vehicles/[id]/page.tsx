"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleDetailContent } from "@/components/vehicle-detail-content";
import { Button } from "@/components/ui/button";
import { type VehicleDetails } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type Vehicle = VehicleDetails & {
  id: string;
  photos: { url: string }[];
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState("");

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

  async function handlePurchase() {
    setPurchasing(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}/reserve`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to purchase vehicle");
      setPurchasing(false);
      return;
    }

    router.push("/reservations");
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingOverlay show label="Loading vehicle..." />
        <Header />
      </div>
    );
  }

  if (!vehicle?.id) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p>Vehicle not found.</p>
          <BackLink href="/inventory" label="Back to inventory" className="mt-4" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LoadingOverlay show={purchasing} label="Purchasing vehicle..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackLink href="/inventory" label="Back to inventory" />

        <div className="mt-8 animate-slide-up">
          <VehicleDetailContent
            vehicle={vehicle}
            sidebar={
              <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                <h2 className="mb-3 font-semibold">Purchase vehicle</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Reserve this vehicle under your company. It will be hidden from other suppliers
                  once purchased.
                </p>
                <Button size="lg" className="w-full" onClick={() => setShowDialog(true)}>
                  Purchase this Vehicle
                </Button>
              </div>
            }
          />
        </div>
      </main>

      {showDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-dialog-title"
        >
          <div
            className={cn(
              "w-full max-w-md rounded-sm border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-slide-up"
            )}
          >
            <h2 id="purchase-dialog-title" className="text-lg font-semibold">
              Confirm purchase
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Pressing confirm below will hide this vehicle listing from other suppliers and
              reserve this vehicle under your company.
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={handlePurchase} disabled={purchasing}>
                {purchasing ? "Confirming..." : "Confirm"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setError("");
                }}
                disabled={purchasing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
