"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StatusBadge } from "@/components/disclaimer";
import { VehicleImage } from "@/components/vehicle-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatOdometer } from "@/lib/utils";
import { formatVehiclePrice } from "@/lib/vehicle";

type ReportingData = {
  stats: {
    totalListings: number;
    available: number;
    reserved: number;
    sold: number;
    rejected: number;
    averagePrice: number;
    totalAvailableValue: number;
    averageOdometer: number;
    listedLast30Days: number;
  };
  makeBreakdown: { make: string; count: number }[];
  reservedVehicles: {
    id: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    price: number;
    status: string;
    licensePlateNumber: string;
    photoUrl: string | null;
    reservedAt: string | null;
    partner: {
      name: string;
      email: string;
      companyName: string | null;
    } | null;
  }[];
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function TeslaReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tesla/reporting")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <LoadingOverlay show={loading} label="Loading reporting..." />
      <PageHeader title="Reporting" description="Trade-in inventory and reservation overview" />

      {data && (
        <div className="animate-slide-up space-y-10">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total listings" value={data.stats.totalListings} />
            <StatCard label="Available" value={data.stats.available} />
            <StatCard label="Reserved" value={data.stats.reserved} />
            <StatCard label="Sold" value={data.stats.sold} />
            <StatCard label="Average price" value={formatVehiclePrice(data.stats.averagePrice)} />
            <StatCard
              label="Available inventory value"
              value={formatVehiclePrice(data.stats.totalAvailableValue)}
            />
            <StatCard
              label="Average odometer"
              value={formatOdometer(data.stats.averageOdometer)}
            />
            <StatCard label="Listed last 30 days" value={data.stats.listedLast30Days} />
          </section>

          {data.makeBreakdown.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Listings by make</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.makeBreakdown.map((row) => (
                  <Card key={row.make} className="border-border/80 bg-card/80 backdrop-blur-sm">
                    <CardContent className="flex items-center justify-between p-4">
                      <span className="font-medium">{row.make}</span>
                      <span className="text-muted-foreground">{row.count}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Currently reserved vehicles</h2>
            {data.reservedVehicles.length === 0 ? (
              <p className="text-muted-foreground">No vehicles are currently reserved.</p>
            ) : (
              <div className="space-y-3">
                {data.reservedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex flex-col gap-4 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm sm:flex-row sm:items-center"
                  >
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-sm bg-muted">
                      {vehicle.photoUrl ? (
                        <VehicleImage
                          src={vehicle.photoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/tesla/listings/${vehicle.id}`}
                          className="font-semibold hover:text-tesla-red"
                        >
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Link>
                        <StatusBadge status={vehicle.status} />
                      </div>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{vehicle.trim}</p>
                      <p className="text-sm text-muted-foreground">
                        Plate {vehicle.licensePlateNumber} · {formatVehiclePrice(vehicle.price)}
                      </p>
                    </div>
                    <div className="shrink-0 text-sm sm:text-right">
                      {vehicle.partner ? (
                        <>
                          <p className="font-medium">
                            {vehicle.partner.companyName ?? vehicle.partner.name}
                          </p>
                          <p className="text-muted-foreground">{vehicle.partner.email}</p>
                          {vehicle.reservedAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Reserved {new Date(vehicle.reservedAt).toLocaleDateString("en-AU")}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">No active reservation record</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
