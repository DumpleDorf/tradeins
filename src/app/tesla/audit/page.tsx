"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { name: string; email: string; role: string } | null;
};

export default function TeslaAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch("/api/audit").then((r) => r.json()).then(setLogs);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/tesla" className="text-sm text-muted-foreground hover:text-tesla-red">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Audit Log</h1>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Actor</th>
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/50">
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-AU")}
                  </td>
                  <td className="py-3 pr-4">
                    {log.actor ? `${log.actor.name} (${log.actor.role})` : "System"}
                  </td>
                  <td className="py-3 pr-4">{log.action}</td>
                  <td className="py-3 pr-4">
                    {log.entityType} · {log.entityId.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
