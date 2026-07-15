import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/tesla/listings", title: "Listings", desc: "Create and manage vehicle listings" },
  { href: "/tesla/reservations", title: "Reserved / Sold", desc: "Review reserved vehicles and confirm sales" },
  { href: "/tesla/reporting", title: "Reporting", desc: "Inventory stats and reserved vehicle overview" },
  { href: "/tesla/partners", title: "Partners", desc: "Invite and manage wholesale partners" },
  { href: "/tesla/audit", title: "Audit Log", desc: "View all platform activity" },
];

export default function TeslaDashboardPage() {
  return (
    <PageShell>
      <PageHeader
        title="Tesla Dashboard"
        description="Manage trade-in wholesale inventory"
        showBack={false}
      />

      <div className="animate-slide-up">
        <Disclaimer variant="listing" />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            className="animate-stagger-in"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <Card className="h-full border-border/80 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10">
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
