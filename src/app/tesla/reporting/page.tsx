"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StatusBadge } from "@/components/disclaimer";
import { VehicleImage } from "@/components/vehicle-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
    reservedLast30Days: number;
    soldLast30Days: number;
  };
  makeBreakdown: { make: string; count: number }[];
  reservationsByWholesaler: { companyName: string; count: number }[];
  reservedVehicles: ReportingVehicle[];
};

type ReportingVehicle = {
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
};

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const card = (
    <Card
      className={cn(
        "border-border/80 bg-card/80 backdrop-blur-sm",
        href &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-tesla-red/50 hover:shadow-md hover:shadow-tesla-red/10"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {href && <p className="mt-2 text-xs text-tesla-red">View listings →</p>}
      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tesla-red/40">
      {card}
    </Link>
  );
}

function VehiclePartnerList({
  title,
  emptyMessage,
  vehicles,
  dateLabel,
}: {
  title: string;
  emptyMessage: string;
  vehicles: ReportingVehicle[];
  dateLabel: string;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {vehicles.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
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
                    <p className="text-muted-foreground">{vehicle.partner.name}</p>
                    <p className="text-muted-foreground">{vehicle.partner.email}</p>
                    {vehicle.reservedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dateLabel} {new Date(vehicle.reservedAt).toLocaleDateString("en-AU")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No wholesaler record</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
            <StatCard
              label="Total listings"
              value={data.stats.totalListings}
              href="/tesla/listings?status=ALL"
            />
            <StatCard
              label="Available"
              value={data.stats.available}
              href="/tesla/listings?status=AVAILABLE"
            />
            <StatCard
              label="Active Reservation Requests"
              value={data.stats.reserved}
              href="/tesla/listings?status=RESERVED"
            />
            <StatCard
              label="Sold"
              value={data.stats.sold}
              href="/tesla/listings?status=SOLD"
            />
            <StatCard
              label="Average price of available inventory"
              value={formatVehiclePrice(data.stats.averagePrice)}
            />
            <StatCard
              label="Available inventory value"
              value={formatVehiclePrice(data.stats.totalAvailableValue)}
            />
            <StatCard
              label="Reserved in last 30 days"
              value={data.stats.reservedLast30Days}
            />
            <StatCard label="Sold in last 30 days" value={data.stats.soldLast30Days} />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Total reservation requests by wholesaler
            </h2>
            {data.reservationsByWholesaler.length === 0 ? (
              <p className="text-muted-foreground">No reservation requests yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.reservationsByWholesaler.map((row) => (
                  <Card
                    key={row.companyName}
                    className="border-border/80 bg-card/80 backdrop-blur-sm"
                  >
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <span className="min-w-0 truncate font-medium">{row.companyName}</span>
                      <span className="shrink-0 text-muted-foreground">{row.count}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {data.makeBreakdown.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Available listings by make</h2>
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

          <VehiclePartnerList
            title="Currently reserved vehicles"
            emptyMessage="No vehicles are currently reserved."
            vehicles={data.reservedVehicles}
            dateLabel="Reserved"
          />
        </div>
      )}
    </PageShell>
  );
}
