"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { BackToDashboard } from "@/components/back-to-dashboard";
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
    <div className="min-h-screen bg-background">
      <LoadingOverlay show={loading} label="Loading listings..." />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Vehicle Listings</h1>
            <BackToDashboard />
          </div>
          <Link href="/tesla/listings/new">
            <Button>New Listing</Button>
          </Link>
        </div>

        <Disclaimer variant="listing" />

        {!loading && vehicles.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No listings yet.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                href={`/tesla/listings/${vehicle.id}`}
                showStatus
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
