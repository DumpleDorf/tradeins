import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/admin/users", title: "User Management", desc: "Manage Tesla employee accounts" },
  { href: "/admin/audit", title: "Full Audit Log", desc: "Complete platform activity history" },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold">Super Admin</h1>
        <p className="mt-1 text-muted-foreground">Platform administration</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
