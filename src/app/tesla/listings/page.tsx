import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { VehicleBrowse } from "@/components/inventory/vehicle-browse";
import { ListingsPageActions } from "@/components/listings-page-actions";

export default function TeslaListingsPage() {
  return (
    <PageShell>
      <PageHeader title="Vehicle Listings" action={<ListingsPageActions />} />

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
