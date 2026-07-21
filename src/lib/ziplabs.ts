/** ZipLabs Superset dashboard — Tesla Wholesale Website report. */
export const ZIPLABS_REPORT_URL =
  "https://ziplabs.teslamotors.com/superset/dashboard/69331/";

/**
 * First AMP acquisition from the report (RN126870852).
 * Used as a temporary probe while the full scrape flow is built out.
 */
export const ZIPLABS_FIRST_AMP_URL =
  "https://amp.tesla.com/acquisition/08bb2bb2-2a44-4d70-a75b-6a72e8c0bbda";

export const ZIPLABS_FIRST_RN = "RN126870852";

/** Open ZipLabs report + first AMP listing (step-1 probe for inventory sync). */
export function openZiplabsInventorySyncProbe() {
  window.open(ZIPLABS_REPORT_URL, "_blank", "noopener,noreferrer");
  window.open(ZIPLABS_FIRST_AMP_URL, "_blank", "noopener,noreferrer");
}
