"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

export default function TeslaListingsPage() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then(setVehicles);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Vehicle Listings</h1>
            <Link href="/tesla" className="text-sm text-muted-foreground hover:text-tesla-red">
              ← Back to dashboard
            </Link>
          </div>
          <Link href="/tesla/listings/new">
            <Button>New Listing</Button>
          </Link>
        </div>

        <Disclaimer variant="listing" />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle: { id: string }) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle as never}
              href={`/tesla/listings/${vehicle.id}`}
              showStatus
            />
          ))}
        </div>
      </main>
    </div>
  );
}
