"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  parseZiplabsWholesaleCsv,
  ZIPLABS_REPORT_URL,
  type ZiplabsCsvRow,
} from "@/lib/ziplabs";

type ZiplabsSyncButtonProps = {
  className?: string;
};

export function ZiplabsSyncButton({ className }: ZiplabsSyncButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    fileName: string;
    count: number;
    first: ZiplabsCsvRow;
  } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const text = await file.text();
      const rows = parseZiplabsWholesaleCsv(text);
      const first = rows[0];

      setSummary({
        fileName: file.name,
        count: rows.length,
        first,
      });

      // Step 1 probe: open the first AMP listing from the export (not hardcoded).
      window.open(first.ampUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read ZipLabs CSV");
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
        {loading ? "Reading CSV…" : "Upload ZipLabs CSV export"}
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
        report as CSV, then upload it here. Opens the first AMPLink from the file;
        full inventory sync comes next.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {summary ? (
        <div className="mt-4 rounded-sm border border-border bg-card/80 p-4 text-sm">
          <p className="font-medium">
            Parsed {summary.count} vehicles from {summary.fileName}
          </p>
          <p className="mt-1 text-muted-foreground">
            Opened first AMPLink: {summary.first.rnNumber} ({summary.first.make}{" "}
            {summary.first.model})
          </p>
        </div>
      ) : null}
    </div>
  );
}
