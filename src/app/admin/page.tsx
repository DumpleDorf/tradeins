import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const teslaLinks = [
  { href: "/tesla/listings", title: "Listings", desc: "Create and manage vehicle listings" },
  { href: "/tesla/reservations", title: "Reservations", desc: "Approve or reject partner reservations" },
  { href: "/tesla/reporting", title: "Reporting", desc: "Inventory stats and reserved vehicle overview" },
  { href: "/tesla/partners", title: "Partners", desc: "Invite and manage wholesale partners" },
  { href: "/tesla/audit", title: "Audit Log", desc: "View all platform activity" },
];

const adminLinks = [
  { href: "/admin/users", title: "User Management", desc: "Manage all platform accounts" },
  { href: "/admin/audit", title: "Full Audit Log", desc: "Complete platform activity history" },
];

const cardClassName =
  "h-full border-border/80 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10";

export default function AdminDashboardPage() {
  return (
    <PageShell>
      <PageHeader
        title="Super Admin"
        description="Platform administration and trade-in management"
        showBack={false}
      />

      <div className="animate-slide-up">
        <Disclaimer variant="listing" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Trade-In Management</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {teslaLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="animate-stagger-in"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <Card className={cardClassName}>
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
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Administration</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {adminLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="animate-stagger-in"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <Card className={cardClassName}>
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
      </section>
    </PageShell>
  );
}
