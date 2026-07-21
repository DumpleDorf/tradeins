"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseZiplabsWholesaleCsv, ZIPLABS_REPORT_URL, type ZiplabsCsvRow } from "@/lib/ziplabs";

type ZiplabsSyncButtonProps = {
  className?: string;
};

type RunLog = {
  rnNumber: string;
  status: "ok" | "error";
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

const IMPORT_LIMIT = 3;

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
  const [parsedCount, setParsedCount] = useState<number | null>(null);

  async function importOne(row: ZiplabsCsvRow, index: number, total: number) {
    setProgress(`(${index + 1}/${total}) Starting job for ${row.rnNumber}…`);

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
    // Unique window name per RN so previous debug tabs stay open.
    const popup = window.open(
      buildAmpJobUrl(row.ampUrl, job.id),
      `amp-scrape-${row.rnNumber}`
    );
    if (!popup) {
      throw new Error("Popup blocked. Allow popups for this site and try again.");
    }

    setProgress(`(${index + 1}/${total}) Scraping ${row.rnNumber} on AMP (fields + images)…`);
    const scraped = await pollJob(job.id);

    if (scraped.status === "failed" || !scraped.fields) {
      const debugHint = scraped.debug?.tileTitles?.length
        ? ` Tiles seen: ${scraped.debug.tileTitles.join(", ")}`
        : "";
      throw new Error(`${scraped.error || "AMP scrape failed"}.${debugHint}`);
    }

    const photoCount = scraped.photoCount ?? 0;
    const photoTitles = (scraped.photoTitles ?? scraped.debug?.photoTitles ?? []).join(", ");
    setProgress(
      `(${index + 1}/${total}) Creating listing ${row.rnNumber} with ${photoCount} photo(s)${
        photoTitles ? ` [${photoTitles}]` : ""
      }…`
    );

    // Import server-side from the job store — do not resend base64 photos (avoids 413).
    const res = await fetch(`/api/ziplabs/jobs/${job.id}/import`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : `Import failed (${res.status})`
      );
    }

    const titles = (data.photoTitles as string[] | undefined)?.join(", ") || photoTitles;
    return {
      rnNumber: row.rnNumber,
      status: "ok" as const,
      detail: `Created listing with ${data.photoCount ?? 0} photo(s)${
        titles ? ` — ${titles}` : ""
      }`,
    };
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError("");
    setLogs([]);
    setParsedCount(null);
    setProgress("Reading CSV…");

    try {
      const text = await file.text();
      const rows = parseZiplabsWholesaleCsv(text);
      setParsedCount(rows.length);

      const batch = rows.slice(0, IMPORT_LIMIT);
      const nextLogs: RunLog[] = [];

      // Sequential: open tab → scrape → import → leave tab open → open next.
      for (let i = 0; i < batch.length; i += 1) {
        try {
          nextLogs.push(await importOne(batch[i], i, batch.length));
        } catch (err) {
          nextLogs.push({
            rnNumber: batch[i].rnNumber,
            status: "error",
            detail: err instanceof Error ? err.message : "Failed",
          });
        }
        setLogs([...nextLogs]);
        await sleep(500);
      }

      setProgress(
        `Finished first ${batch.length} of ${rows.length} vehicles. AMP tabs left open for debugging.`
      );
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
        {loading ? "Importing…" : "Upload ZipLabs CSV export"}
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
        report as CSV, then upload it here. Processes the first {IMPORT_LIMIT} vehicles
        one-by-one. AMP tabs stay open for debugging.
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
        . Stay logged into AMP and allow popups. Black debug box on AMP = scrape progress.
      </p>

      {progress ? <p className="mt-3 text-sm text-muted-foreground">{progress}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {parsedCount !== null || logs.length > 0 ? (
        <div className="mt-4 space-y-2 rounded-sm border border-border bg-card/80 p-4 text-sm">
          {parsedCount !== null ? (
            <p className="font-medium">
              Parsed {parsedCount} vehicles — processing first {IMPORT_LIMIT} sequentially
            </p>
          ) : null}
          <ul className="space-y-1 text-muted-foreground">
            {logs.map((log) => (
              <li key={`${log.rnNumber}-${log.detail}`}>
                <span className={log.status === "ok" ? "text-foreground" : "text-red-600"}>
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
