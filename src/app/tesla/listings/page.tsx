"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

type ListingVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  price: number;
  licensePlateNumber: string;
  status?: string;
  photos: { url: string }[];
};

export default function TeslaListingsPage() {
  const [vehicles, setVehicles] = useState<ListingVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => {
        setVehicles(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <PageShell>
      <LoadingOverlay show={loading} label="Loading listings..." />

      <PageHeader
        title="Vehicle Listings"
        action={
          <Link href="/tesla/listings/new">
            <Button className="shadow-md shadow-tesla-red/20 transition-shadow hover:shadow-lg hover:shadow-tesla-red/30">
              New Listing
            </Button>
          </Link>
        }
      />

      <div className="animate-slide-up">
        <Disclaimer variant="listing" />
      </div>

      {!loading && vehicles.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No listings yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle, index) => (
            <div
              key={vehicle.id}
              className="animate-stagger-in"
              style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
            >
              <VehicleCard
                vehicle={vehicle}
                href={`/tesla/listings/${vehicle.id}`}
                showStatus
              />
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
