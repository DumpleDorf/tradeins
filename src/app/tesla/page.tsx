import Link from "next/link";
import { Header } from "@/components/header";
import { Disclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/tesla/listings", title: "Listings", desc: "Create and manage vehicle listings" },
  { href: "/tesla/reservations", title: "Reservations", desc: "Approve or reject partner reservations" },
  { href: "/tesla/partners", title: "Partners", desc: "Invite and manage wholesale partners" },
  { href: "/tesla/audit", title: "Audit Log", desc: "View all platform activity" },
];

export default function TeslaDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold">Tesla Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Manage trade-in wholesale inventory</p>

        <div className="mt-6">
          <Disclaimer variant="listing" />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:border-tesla-red/50">
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
      </main>
    </div>
  );
}
