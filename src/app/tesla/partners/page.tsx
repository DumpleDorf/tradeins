"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
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

const partnerFields = [
  ["email", "Email"],
  ["name", "Contact Name"],
  ["companyName", "Company Name"],
  ["contactName", "Primary Contact"],
  ["contactPhone", "Phone (optional)"],
] as const;

export default function TeslaPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/partners");
    const data = await res.json();
    setPartners(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    setBusy(true);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create partner");
      setBusy(false);
      return;
    }

    setShowCreate(false);
    (e.target as HTMLFormElement).reset();
    setBusy(false);
    load();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>, partner: Partner) {
    e.preventDefault();
    setError("");

    setBusy(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.password) {
      delete payload.password;
    }

    const res = await fetch(`/api/partners/${partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to update partner");
      setBusy(false);
      return;
    }

    setEditingId(null);
    setBusy(false);
    load();
  }

  async function setPartnerStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to update partner status");
      setBusy(false);
      return;
    }

    setBusy(false);
    load();
  }

  async function handleDelete(id: string) {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/partners/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to delete partner");
      setBusy(false);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    setBusy(false);
    load();
  }

  function renderPartnerForm(
    partner: Partner | null,
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    onCancel: () => void,
    submitLabel: string,
    passwordRequired: boolean
  ) {
    return (
      <form
        onSubmit={onSubmit}
        className="mt-4 grid gap-4 rounded-sm border border-border bg-card p-4 sm:grid-cols-2"
      >
        {partnerFields.map(([name, label]) => {
          let defaultValue = "";
          if (partner) {
            if (name === "companyName" || name === "contactName") {
              defaultValue = partner.partnerProfile?.[name] ?? "";
            } else if (name === "contactPhone") {
              defaultValue = partner.partnerProfile?.contactPhone ?? "";
            } else {
              defaultValue = partner[name];
            }
          }

          return (
          <div key={name} className="space-y-1">
            <Label htmlFor={`${partner?.id ?? "new"}-${name}`}>{label}</Label>
            <Input
              id={`${partner?.id ?? "new"}-${name}`}
              name={name}
              defaultValue={defaultValue}
              required={name !== "contactPhone"}
            />
          </div>
          );
        })}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`${partner?.id ?? "new"}-password`}>
            Password{passwordRequired ? "" : " (leave blank to keep current)"}
          </Label>
          <Input
            id={`${partner?.id ?? "new"}-password`}
            name="password"
            type="password"
            minLength={8}
            required={passwordRequired}
            autoComplete="new-password"
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <PageShell>
      <LoadingOverlay show={loading || busy} label={busy ? "Saving..." : "Loading partners..."} />

      <PageHeader
        title="Partner Accounts"
        action={
          <Button onClick={() => { setShowCreate(true); setEditingId(null); setError(""); }}>
            Add Partner
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {showCreate &&
          renderPartnerForm(
            null,
            handleCreate,
            () => setShowCreate(false),
            "Create Partner",
            true
          )}

        <div className="mt-8 space-y-3">
          {partners.map((p) => (
            <div key={p.id} className="rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.partnerProfile?.companyName}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.email} · {p.partnerProfile?.contactName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(editingId === p.id ? null : p.id);
                      setShowCreate(false);
                      setError("");
                    }}
                  >
                    {editingId === p.id ? "Close" : "Edit"}
                  </Button>
                  {p.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setPartnerStatus(p.id, "INACTIVE")}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setPartnerStatus(p.id, "ACTIVE")}>
                      Activate
                    </Button>
                  )}
                  {deletingId === p.id ? (
                    <>
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleDelete(p.id)}>
                        Confirm Delete
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setDeletingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => setDeletingId(p.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {editingId === p.id &&
                renderPartnerForm(
                  p,
                  (e) => handleEdit(e, p),
                  () => setEditingId(null),
                  "Save Changes",
                  false
                )}
            </div>
          ))}
        </div>
    </PageShell>
  );
}
