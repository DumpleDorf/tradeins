"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/disclaimer";

type Partner = {
  id: string;
  email: string;
  name: string;
  status: string;
  partnerProfile: {
    companyName: string;
    contactName: string;
    contactPhone: string | null;
  } | null;
};

export default function TeslaPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [notifyPartners, setNotifyPartners] = useState(false);

  function load() {
    fetch("/api/partners").then((r) => r.json()).then(setPartners);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setNotifyPartners(d.notifyPartnersOnNewListing));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    setShowInvite(false);
    load();
  }

  async function toggleNotify() {
    const newValue = !notifyPartners;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyPartnersOnNewListing: newValue }),
    });
    setNotifyPartners(newValue);
  }

  async function deactivate(id: string) {
    await fetch(`/api/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INACTIVE" }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/tesla" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to dashboard
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Partner Accounts</h1>
          <Button onClick={() => setShowInvite(true)}>Invite Partner</Button>
        </div>

        <label className="mt-6 flex items-center gap-3 text-sm">
          <input type="checkbox" checked={notifyPartners} onChange={toggleNotify} />
          Email all active partners when a new listing goes live
        </label>

        {showInvite && (
          <form
            onSubmit={handleInvite}
            className="mt-6 grid gap-4 rounded-sm border border-border bg-card p-4 sm:grid-cols-2"
          >
            {[
              ["email", "Email"],
              ["name", "Contact Name"],
              ["companyName", "Company Name"],
              ["contactName", "Primary Contact"],
              ["contactPhone", "Phone (optional)"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-1">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} name={name} required={name !== "contactPhone"} />
              </div>
            ))}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Send Invite</Button>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-3">
          {partners.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-sm border border-border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.partnerProfile?.companyName}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.email} · {p.partnerProfile?.contactName}
                </p>
              </div>
              {p.status === "ACTIVE" && (
                <Button size="sm" variant="outline" onClick={() => deactivate(p.id)}>
                  Deactivate
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
