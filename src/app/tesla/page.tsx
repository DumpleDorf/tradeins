"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationRequestsBadge } from "@/components/reservation-requests-badge";
import { ZiplabsSyncButton } from "@/components/ziplabs-sync-button";

const links: {
  href: string;
  title: string;
  desc: string;
  showReservationBadge?: boolean;
}[] = [
  { href: "/tesla/listings", title: "Listings", desc: "Create and manage vehicle listings" },
  {
    href: "/tesla/reservations",
    title: "Reserved / Sold",
    desc: "Review reservation requests and sold vehicles",
    showReservationBadge: true,
  },
  { href: "/tesla/reporting", title: "Reporting", desc: "Inventory stats and reserved vehicle overview" },
  { href: "/tesla/partners", title: "Wholesalers", desc: "Invite and manage wholesaler accounts" },
  { href: "/tesla/audit", title: "Audit Log", desc: "View all platform activity" },
];

type DashboardStats = {
  available: number;
  reservationRequests: number;
  sold: number;
};

export default function TeslaDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/tesla/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.available === "number") {
          setStats(data);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Tesla Dashboard"
        description="Manage trade-in wholesale inventory"
        showBack={false}
      />

      <ZiplabsSyncButton className="mt-6" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/tesla/reservations?status=RESERVED"
          className="group rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10"
        >
          <p className="text-sm text-muted-foreground group-hover:text-foreground">
            Reservation requests
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {stats ? stats.reservationRequests : "—"}
          </p>
          <p className="mt-2 text-xs text-tesla-red">View requests →</p>
        </Link>

        <Link
          href="/tesla/listings"
          className="group rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10"
        >
          <p className="text-sm text-muted-foreground group-hover:text-foreground">
            Available vehicles
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {stats ? stats.available : "—"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground group-hover:text-tesla-red">
            View listings →
          </p>
        </Link>

        <Link
          href="/tesla/reservations?status=SOLD"
          className="group rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10"
        >
          <p className="text-sm text-muted-foreground group-hover:text-foreground">Sold vehicles</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {stats ? stats.sold : "—"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground group-hover:text-tesla-red">
            View sold →
          </p>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            className="animate-stagger-in"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <Card className="relative h-full overflow-visible border-border/80 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10">
              {link.showReservationBadge ? (
                <ReservationRequestsBadge className="absolute right-0 top-0 z-10 translate-x-1/2 -translate-y-1/2" />
              ) : null}
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
