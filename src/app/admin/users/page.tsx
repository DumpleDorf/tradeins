"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
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
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    setShowForm(false);
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to admin
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Tesla Employees</h1>
          <Button onClick={() => setShowForm(true)}>Add Employee</Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 grid gap-4 rounded-sm border border-border bg-card p-4 sm:grid-cols-3"
          >
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <Button type="submit" className="sm:col-span-3">
              Create Employee
            </Button>
          </form>
        )}

        <div className="mt-8 space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-sm border border-border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{u.name}</span>
                  <StatusBadge status={u.role} />
                  <StatusBadge status={u.status} />
                </div>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
