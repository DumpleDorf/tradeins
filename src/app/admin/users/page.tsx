"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/disclaimer";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  partnerProfile: { companyName: string } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
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
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create user");
      setBusy(false);
      return;
    }

    setShowForm(false);
    (e.target as HTMLFormElement).reset();
    setBusy(false);
    load();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>, user: User) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.password) {
      delete payload.password;
    }

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to update user");
      setBusy(false);
      return;
    }

    setEditingId(null);
    setBusy(false);
    load();
  }

  async function setUserStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to update user status");
      setBusy(false);
      return;
    }

    setBusy(false);
    load();
  }

  async function handleDelete(id: string) {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to delete user");
      setBusy(false);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    setBusy(false);
    load();
  }

  function renderUserForm(
    user: User | null,
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
        <div className="space-y-1">
          <Label htmlFor={`${user?.id ?? "new"}-name`}>Name</Label>
          <Input
            id={`${user?.id ?? "new"}-name`}
            name="name"
            defaultValue={user?.name ?? ""}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${user?.id ?? "new"}-email`}>Email</Label>
          <Input
            id={`${user?.id ?? "new"}-email`}
            name="email"
            type="email"
            defaultValue={user?.email ?? ""}
            required
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`${user?.id ?? "new"}-password`}>
            Password{passwordRequired ? "" : " (leave blank to keep current)"}
          </Label>
          <Input
            id={`${user?.id ?? "new"}-password`}
            name="password"
            type="password"
            minLength={8}
            required={passwordRequired}
            autoComplete="new-password"
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy}>{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <PageShell>
      <LoadingOverlay show={loading || busy} label={busy ? "Saving..." : "Loading users..."} />

      <PageHeader
        title="User Management"
        action={
          <Button onClick={() => { setShowForm(true); setEditingId(null); setError(""); }}>
            Add Tesla Employee
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {showForm &&
          renderUserForm(
            null,
            handleCreate,
            () => setShowForm(false),
            "Create Employee",
            true
          )}

        <div className="mt-8 space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{u.name}</span>
                    <StatusBadge status={u.role} />
                    <StatusBadge status={u.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {u.email}
                    {u.partnerProfile?.companyName ? ` · ${u.partnerProfile.companyName}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(editingId === u.id ? null : u.id);
                      setShowForm(false);
                      setError("");
                    }}
                  >
                    {editingId === u.id ? "Close" : "Edit"}
                  </Button>
                  {u.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setUserStatus(u.id, "INACTIVE")}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setUserStatus(u.id, "ACTIVE")}>
                      Activate
                    </Button>
                  )}
                  {deletingId === u.id ? (
                    <>
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleDelete(u.id)}>
                        Confirm Delete
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setDeletingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => setDeletingId(u.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {editingId === u.id &&
                renderUserForm(
                  u,
                  (e) => handleEdit(e, u),
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
