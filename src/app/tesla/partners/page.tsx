"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { RequiredAsterisk, RequiredFieldsHint } from "@/components/vehicle-form-fields";
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

const actionButtonClassName = "w-[7.25rem] shrink-0";

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
    try {
      const res = await fetch("/api/partners");
      const data = await res.json();
      setPartners(Array.isArray(data) ? data : []);
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
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
      setError(typeof data.error === "string" ? data.error : "Failed to create wholesaler");
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
      setError(typeof data.error === "string" ? data.error : "Failed to update wholesaler");
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
      setError(typeof data.error === "string" ? data.error : "Failed to update wholesaler status");
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
      setError(typeof data.error === "string" ? data.error : "Failed to delete wholesaler");
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
    const formId = partner?.id ?? "new";

    return (
      <form
        onSubmit={onSubmit}
        className="mt-4 grid gap-4 rounded-sm border border-border bg-card p-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <RequiredFieldsHint />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${formId}-companyName`}>
            Company Name <RequiredAsterisk />
          </Label>
          <Input
            id={`${formId}-companyName`}
            name="companyName"
            defaultValue={partner?.partnerProfile?.companyName ?? ""}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${formId}-email`}>
            Primary Contact/Login (email) <RequiredAsterisk />
          </Label>
          <Input
            id={`${formId}-email`}
            name="email"
            type="email"
            defaultValue={partner?.email ?? ""}
            required
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`${formId}-contactPhone`}>Phone (optional)</Label>
          <Input
            id={`${formId}-contactPhone`}
            name="contactPhone"
            type="tel"
            defaultValue={partner?.partnerProfile?.contactPhone ?? ""}
          />
        </div>
        <div className="space-y-2 rounded-sm border border-border/60 bg-background/40 p-3 sm:col-span-2">
          <div className="space-y-1">
            <Label htmlFor={`${formId}-password`}>
              {passwordRequired ? "Password" : "Change Password"}
              {passwordRequired ? (
                <>
                  {" "}
                  <RequiredAsterisk />
                </>
              ) : null}
            </Label>
            <p className="text-xs text-muted-foreground">
              {passwordRequired
                ? "Set the initial password for this wholesaler account."
                : "Fill this field to change the account password. Leave blank to keep the current password."}
            </p>
          </div>
          <Input
            id={`${formId}-password`}
            name="password"
            type="password"
            minLength={8}
            required={passwordRequired}
            autoComplete="new-password"
            placeholder={passwordRequired ? undefined : "Leave blank to keep current password"}
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
      <LoadingOverlay show={loading || busy} label={busy ? "Saving..." : "Loading wholesalers..."} />

      <PageHeader
        title="Wholesaler Accounts"
        action={
          <Button onClick={() => { setShowCreate(true); setEditingId(null); setError(""); }}>
            Add Wholesaler
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {showCreate &&
          renderPartnerForm(
            null,
            handleCreate,
            () => setShowCreate(false),
            "Create Wholesaler",
            true
          )}

        <div className="mt-8 space-y-3">
          {partners.map((p) => (
            <div key={p.id} className="rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.partnerProfile?.companyName}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.email}
                    {p.partnerProfile?.contactPhone
                      ? ` · ${p.partnerProfile.contactPhone}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={actionButtonClassName}
                    onClick={() => {
                      setEditingId(editingId === p.id ? null : p.id);
                      setShowCreate(false);
                      setError("");
                    }}
                  >
                    {editingId === p.id ? "Close" : "Edit"}
                  </Button>
                  {p.status === "ACTIVE" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={actionButtonClassName}
                      disabled={busy}
                      onClick={() => setPartnerStatus(p.id, "INACTIVE")}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className={actionButtonClassName}
                      disabled={busy}
                      onClick={() => setPartnerStatus(p.id, "ACTIVE")}
                    >
                      Activate
                    </Button>
                  )}
                  {deletingId === p.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        className={actionButtonClassName}
                        disabled={busy}
                        onClick={() => handleDelete(p.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={actionButtonClassName}
                        disabled={busy}
                        onClick={() => setDeletingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className={actionButtonClassName}
                      disabled={busy}
                      onClick={() => setDeletingId(p.id)}
                    >
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
