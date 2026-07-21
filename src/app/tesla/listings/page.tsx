import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { VehicleBrowse } from "@/components/inventory/vehicle-browse";
import { Button } from "@/components/ui/button";

export default function TeslaListingsPage() {
  return (
    <PageShell>
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

      <div className="mt-8">
        <Suspense fallback={null}>
          <VehicleBrowse
            apiEndpoint="/api/vehicles"
            storageKey="tesla-listings-view-mode-v2"
            vehicleBasePath="/tesla/listings/"
            loadingLabel="Loading listings..."
            emptyMessage="No listings match your search or filters."
            sortSelectId="tesla-listings-sort"
            showStatus
            showStatusFilter
          />
        </Suspense>
      </div>
    </PageShell>
  );
}
