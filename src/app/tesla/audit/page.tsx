"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { LoadingOverlay } from "@/components/loading-overlay";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <PageShell>
      <LoadingOverlay show={loading} label="Loading audit log..." />

      <PageHeader title="Audit Log" />

      <div className="animate-slide-up overflow-x-auto rounded-sm border border-border/80 bg-card/80 backdrop-blur-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 pb-3 pt-4">Time</th>
              <th className="pb-3 pr-4 pt-4">Actor</th>
              <th className="pb-3 pr-4 pt-4">Action</th>
              <th className="pb-3 pr-4 pt-4">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                <td className="px-4 py-3 whitespace-nowrap">
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
    </PageShell>
  );
}
