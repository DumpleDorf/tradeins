/** ZipLabs Superset dashboard — Tesla Wholesale Website report. */
export const ZIPLABS_REPORT_URL =
  "https://ziplabs.teslamotors.com/superset/dashboard/69331/";

/**
 * Runtime helper that waits for the ZipLabs table, then opens the first AMPLink.
 * Intended to run in the ZipLabs page context (bookmarklet / userscript) — not from
 * teslatradeins.com.au (browsers block cross-origin DOM access).
 */
export const ZIPLABS_OPEN_FIRST_AMP_SOURCE = `
(async function openFirstZiplabsAmpLink() {
  function findFirstAmpLink() {
    return (
      document.querySelector(
        'tr.tablev2-first-row a[href*="amp.tesla.com/acquisition/"]'
      ) ||
      document.querySelector('a[href*="amp.tesla.com/acquisition/"]')
    );
  }

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const link = findFirstAmpLink();
    const href = link && link.getAttribute("href");
    if (href) {
      const absolute = new URL(href, window.location.origin).href;
      window.open(absolute, "_blank", "noopener,noreferrer");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  alert(
    "Could not find an AMPLink yet. Wait until the ZipLabs table finishes loading, then run the helper again."
  );
})();
`.trim();

/** Bookmarklet that runs the first-AMPLink opener on the current (ZipLabs) page. */
export function getZiplabsOpenFirstAmpBookmarklet() {
  return `javascript:${encodeURIComponent(ZIPLABS_OPEN_FIRST_AMP_SOURCE)}`;
}

/** Open only the ZipLabs report (AMPLink is discovered dynamically on that page). */
export function openZiplabsReport() {
  window.open(ZIPLABS_REPORT_URL, "_blank", "noopener,noreferrer");
}
