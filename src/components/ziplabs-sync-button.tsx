"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseZiplabsWholesaleCsv, ZIPLABS_REPORT_URL, type ZiplabsCsvRow } from "@/lib/ziplabs";
import type { ZiplabsInconsistency } from "@/lib/ziplabs-sync-plan";

type ZiplabsSyncButtonProps = {
  className?: string;
};

type RunLog = {
  rnNumber: string;
  status: "ok" | "error" | "skipped" | "deleted" | "inconsistent";
  detail: string;
};

type JobPollResult = {
  status: "pending" | "scraped" | "failed";
  error?: string;
  fields?: unknown;
  photoCount?: number;
  photoTitles?: string[];
  debug?: {
    tileTitles?: string[];
    photoTitles?: string[];
    failures?: string[];
  };
};

type AnalyzeResponse = {
  reportCount: number;
  toCreate: string[];
  toDelete: { id: string; make: string; model: string; year: number; status: string }[];
  inconsistencies: ZiplabsInconsistency[];
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollJob(jobId: string, timeoutMs = 180_000): Promise<JobPollResult> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`/api/ziplabs/jobs/${jobId}`);
    const job = (await res.json()) as JobPollResult & { error?: string };
    if (!res.ok) {
      throw new Error(typeof job.error === "string" ? job.error : "Failed to poll scrape job");
    }
    if (job.status === "scraped" || job.status === "failed") {
      return job;
    }
    await sleep(1000);
  }
  throw new Error(
    "Timed out waiting for AMP scrape. Install the AMP scrape userscript, stay logged into AMP, and allow popups."
  );
}

function buildAmpJobUrl(ampUrl: string, jobId: string) {
  const url = new URL(ampUrl);
  url.hash = new URLSearchParams({
    teslatradeinsJob: jobId,
    teslatradeinsOrigin: window.location.origin,
  }).toString();
  return url.toString();
}

export function ZiplabsSyncButton({ className }: ZiplabsSyncButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  async function createOne(row: ZiplabsCsvRow, index: number, total: number) {
    setProgress(`(${index + 1}/${total}) Starting AMP scrape for ${row.rnNumber}…`);

    const jobRes = await fetch("/api/ziplabs/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rnNumber: row.rnNumber,
        site: row.serviceCenter,
        ampUrl: row.ampUrl,
      }),
    });
    const job = await jobRes.json();
    if (!jobRes.ok) {
      throw new Error(typeof job.error === "string" ? job.error : "Failed to create scrape job");
    }

    setProgress(`(${index + 1}/${total}) Opening AMP for ${row.rnNumber}…`);
    const popup = window.open(
      buildAmpJobUrl(row.ampUrl, job.id),
      `amp-scrape-${row.rnNumber}`
    );
    if (!popup) {
      throw new Error("Popup blocked. Allow popups for this site and try again.");
    }

    try {
      setProgress(`(${index + 1}/${total}) Scraping ${row.rnNumber}…`);
      const scraped = await pollJob(job.id);

      if (scraped.status === "failed" || !scraped.fields) {
        throw new Error(scraped.error || "AMP scrape failed");
      }

      setProgress(`(${index + 1}/${total}) Creating listing ${row.rnNumber}…`);
      const res = await fetch(`/api/ziplabs/jobs/${job.id}/import`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : `Import failed (${res.status})`
        );
      }

      return {
        rnNumber: row.rnNumber,
        status: "ok" as const,
        detail: `Created listing with ${data.photoCount ?? 0} photo(s)`,
      };
    } finally {
      // Userscript also closes after scrape; this covers timeouts / stuck tabs.
      if (!popup.closed) {
        popup.close();
      }
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError("");
    setLogs([]);
    setSummary(null);
    setProgress("Reading CSV…");

    try {
      const text = await file.text();
      const rows = parseZiplabsWholesaleCsv(text);
      const byRn = new Map(rows.map((row) => [row.rnNumber.toUpperCase(), row]));
      const rnNumbers = rows.map((row) => row.rnNumber);

      setProgress("Analyzing report vs website inventory…");
      const analyzeRes = await fetch("/api/ziplabs/sync/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnNumbers }),
      });
      const plan = (await analyzeRes.json()) as AnalyzeResponse;
      if (!analyzeRes.ok) {
        throw new Error(plan.error || "Failed to analyze ZipLabs sync");
      }

      const nextLogs: RunLog[] = [];

      for (const item of plan.inconsistencies) {
        nextLogs.push({
          rnNumber: item.rnNumber,
          status: "inconsistent",
          detail: item.reason,
        });
      }
      setLogs([...nextLogs]);

      setProgress(`Deleting ${plan.toDelete.length} AVAILABLE listing(s) not on report…`);
      const deleteRes = await fetch("/api/ziplabs/sync/apply-deletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnNumbers: plan.toDelete.map((vehicle) => vehicle.id) }),
      });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) {
        throw new Error(deleteData.error || "Failed to delete listings");
      }

      const deleted = (deleteData.deleted ?? []) as {
        rnNumber: string;
        make: string;
        model: string;
        year: number;
      }[];
      for (const vehicle of deleted) {
        nextLogs.push({
          rnNumber: vehicle.rnNumber,
          status: "deleted",
          detail: `Deleted AVAILABLE listing (${vehicle.year} ${vehicle.make} ${vehicle.model}) — not on ZipLabs report`,
        });
      }
      setLogs([...nextLogs]);

      const createQueue = plan.toCreate
        .map((rn) => byRn.get(rn.toUpperCase()))
        .filter((row): row is ZiplabsCsvRow => Boolean(row));
      const created: string[] = [];
      const createErrors: { rnNumber: string; error: string }[] = [];

      for (let i = 0; i < createQueue.length; i += 1) {
        try {
          const result = await createOne(createQueue[i], i, createQueue.length);
          created.push(result.rnNumber);
          nextLogs.push(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed";
          createErrors.push({ rnNumber: createQueue[i].rnNumber, error: message });
          nextLogs.push({
            rnNumber: createQueue[i].rnNumber,
            status: "error",
            detail: message,
          });
        }
        setLogs([...nextLogs]);
        await sleep(500);
      }

      const resultPayload = {
        ranAt: new Date().toISOString(),
        fileName: file.name,
        reportCount: plan.reportCount,
        created,
        deleted,
        createErrors,
        inconsistencies: plan.inconsistencies,
      };

      await fetch("/api/ziplabs/sync/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultPayload),
      });

      setSummary(
        [
          `Report rows: ${plan.reportCount}`,
          `Inconsistencies: ${plan.inconsistencies.length}`,
          `Deleted AVAILABLE not on report: ${deleted.length}`,
          `Created: ${created.length}`,
          createErrors.length ? `Create errors: ${createErrors.length}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      );
      setProgress("ZipLabs sync finished. See Reporting for the inconsistency list.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process ZipLabs CSV");
      setProgress("");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Syncing…" : "Upload ZipLabs CSV export"}
      </Button>

      <p className="mt-2 text-xs text-muted-foreground">
        Export the{" "}
        <a
          href={ZIPLABS_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Tesla Wholesale Website
        </a>{" "}
        report as CSV, then upload it here. Sync will: create every missing RN (AMP scrape
        one-by-one), flag report/website conflicts, and delete AVAILABLE listings not on the
        report.
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        One-time setup: install{" "}
        <a
          href="https://www.tampermonkey.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Tampermonkey
        </a>
        , then install/update the{" "}
        <a href="/amp-scrape.user.js" className="underline underline-offset-2">
          AMP scrape helper (v1.5.1)
        </a>
        . Stay logged into AMP and allow popups.
      </p>

      {progress ? <p className="mt-3 text-sm text-muted-foreground">{progress}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {summary ? <p className="mt-3 text-sm font-medium">{summary}</p> : null}

      {logs.length > 0 ? (
        <div className="mt-4 max-h-80 space-y-1 overflow-y-auto rounded-sm border border-border bg-card/80 p-4 text-sm">
          <ul className="space-y-1 text-muted-foreground">
            {logs.map((log) => (
              <li key={`${log.rnNumber}-${log.detail}`}>
                <span
                  className={
                    log.status === "error"
                      ? "text-red-600"
                      : log.status === "inconsistent" || log.status === "skipped"
                        ? "text-amber-700 dark:text-amber-500"
                        : log.status === "deleted"
                          ? "text-orange-700 dark:text-orange-400"
                          : "text-foreground"
                  }
                >
                  {log.rnNumber}: {log.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
