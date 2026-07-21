"use client";

import { Button } from "@/components/ui/button";
import { openZiplabsInventorySyncProbe, ZIPLABS_FIRST_RN } from "@/lib/ziplabs";

type ZiplabsSyncButtonProps = {
  className?: string;
};

export function ZiplabsSyncButton({ className }: ZiplabsSyncButtonProps) {
  return (
    <div className={className}>
      <Button type="button" onClick={openZiplabsInventorySyncProbe}>
        Run ZipLabs report / Update available inventory
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Opens the ZipLabs wholesale report and the first AMP listing (
        {ZIPLABS_FIRST_RN}) in new tabs. Full scrape sync comes next.
      </p>
    </div>
  );
}
