import Link from "next/link";
import { Header } from "@/components/header";
import { VehicleBrowse } from "@/components/inventory/vehicle-browse";
import { Button } from "@/components/ui/button";

export default function InventoryPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-slide-up space-y-1">
            <h1 className="text-4xl font-semibold tracking-tight">Available Inventory</h1>
            <p className="text-muted-foreground">
              Browse wholesaler-ready vehicles. Reserving marks your intention to buy.
            </p>
          </div>
          <Link href="/reservations" className="animate-slide-up shrink-0">
            <Button variant="outline" className="border-border/80 bg-card/80 backdrop-blur-sm">
              My Reservations
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <VehicleBrowse
            apiEndpoint="/api/inventory"
            storageKey="inventory-view-mode-v2"
            vehicleBasePath="/vehicles/"
            loadingLabel="Loading inventory..."
            sortSelectId="inventory-sort"
          />
        </div>
      </main>
    </div>
  );
}
