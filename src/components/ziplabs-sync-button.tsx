"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getZiplabsOpenFirstAmpBookmarklet,
  openZiplabsReport,
  ZIPLABS_REPORT_URL,
} from "@/lib/ziplabs";

type ZiplabsSyncButtonProps = {
  className?: string;
};

export function ZiplabsSyncButton({ className }: ZiplabsSyncButtonProps) {
  const [showHelper, setShowHelper] = useState(false);
  const [copied, setCopied] = useState(false);
  const bookmarklet = useMemo(() => getZiplabsOpenFirstAmpBookmarklet(), []);

  function handleRun() {
    openZiplabsReport();
    setShowHelper(true);
    setCopied(false);
  }

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
    } catch {
      setCopied(false);
      window.prompt("Copy this bookmarklet, then run it on the ZipLabs tab:", bookmarklet);
    }
  }

  return (
    <div className={className}>
      <Button type="button" onClick={handleRun}>
        Run ZipLabs report / Update available inventory
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Opens{" "}
        <a
          href={ZIPLABS_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          the ZipLabs wholesale report
        </a>
        . The first AMPLink is read from the live table (not hardcoded).
      </p>

      {showHelper ? (
        <div className="mt-4 space-y-3 rounded-sm border border-border bg-card/80 p-4 text-sm">
          <p className="font-medium">Open the first AMPLink from the report</p>
          <p className="text-muted-foreground">
            Browsers block this site from reading the ZipLabs tab, so the first AMPLink
            must be opened from inside ZipLabs after the table loads.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              One-time (recommended): install{" "}
              <a
                href="https://www.tampermonkey.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Tampermonkey
              </a>
              , then open{" "}
              <a
                href="/ziplabs-open-first-amp.user.js"
                className="underline underline-offset-2"
              >
                this userscript
              </a>
              . After that, pressing the button above opens ZipLabs and the script waits
              for the table, then opens whichever AMPLink is in the first row.
            </li>
            <li>
              Or, on the ZipLabs tab after the table loads, run this bookmarklet (drag to
              bookmarks bar, or copy and paste into the address bar):
            </li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <a
              href={bookmarklet}
              className="inline-flex h-10 items-center rounded-sm border border-border bg-transparent px-4 text-sm font-medium hover:bg-muted"
              onClick={(event) => {
                // Prevent navigating away from the dashboard if clicked in-place.
                event.preventDefault();
                window.alert(
                  "Drag this link to your bookmarks bar, then click it while the ZipLabs report tab is active."
                );
              }}
            >
              Open first AMPLink
            </a>
            <Button type="button" variant="outline" onClick={copyBookmarklet}>
              {copied ? "Copied" : "Copy bookmarklet"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
