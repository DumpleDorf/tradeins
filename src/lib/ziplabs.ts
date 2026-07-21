/** ZipLabs Superset dashboard — Tesla Wholesale Website report (for reference links). */
export const ZIPLABS_REPORT_URL =
  "https://ziplabs.teslamotors.com/superset/dashboard/69331/";

export type ZiplabsCsvRow = {
  rnNumber: string;
  ampUrl: string;
  acquisitionId: string;
  make: string;
  model: string;
  serviceCenter: string;
};

/** Minimal CSV parser that supports quoted fields and "" escapes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip trailing empty line
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushField();
      pushRow();
    } else if (char === "\r") {
      // ignore; handle \r\n via \n
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
}

function extractRnAndAmpUrl(ampLinkCell: string): { rnNumber: string; ampUrl: string } | null {
  const hrefMatch = ampLinkCell.match(
    /href\s*=\s*""?(https:\/\/amp\.tesla\.com\/acquisition\/[^"<>]+)""?/i
  ) || ampLinkCell.match(/(https:\/\/amp\.tesla\.com\/acquisition\/[a-f0-9-]+)/i);

  const rnMatch = ampLinkCell.match(/\b(RN\d+)\b/i);
  const ampUrl = hrefMatch?.[1]?.replace(/""/g, '"').trim();
  const rnNumber = rnMatch?.[1]?.toUpperCase();

  if (!ampUrl || !rnNumber) return null;
  return { rnNumber, ampUrl };
}

/**
 * Parse a ZipLabs "Tesla Wholesale Website" CSV export into structured rows.
 * Expected columns: AMPLink, acquisition_id, make, model, ServiceCenterforPickUp
 */
export function parseZiplabsWholesaleCsv(text: string): ZiplabsCsvRow[] {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length < 2) {
    throw new Error("CSV appears empty. Export the ZipLabs Tesla Wholesale Website report and try again.");
  }

  const headers = table[0].map((h) => h.trim().toLowerCase());
  const ampIdx = headers.findIndex((h) => h === "amplink" || h.includes("amplink"));
  const acquisitionIdx = headers.findIndex((h) => h === "acquisition_id" || h.includes("acquisition"));
  const makeIdx = headers.findIndex((h) => h === "make");
  const modelIdx = headers.findIndex((h) => h === "model");
  const centerIdx = headers.findIndex(
    (h) => h === "servicecenterforpickup" || h.includes("servicecenter")
  );

  if (ampIdx < 0) {
    throw new Error('CSV is missing an "AMPLink" column. Use the ZipLabs Tesla Wholesale Website export.');
  }

  const rows: ZiplabsCsvRow[] = [];

  for (const cells of table.slice(1)) {
    if (cells.every((cell) => !cell.trim())) continue;
    const parsed = extractRnAndAmpUrl(cells[ampIdx] ?? "");
    if (!parsed) continue;

    rows.push({
      rnNumber: parsed.rnNumber,
      ampUrl: parsed.ampUrl,
      acquisitionId: (cells[acquisitionIdx] ?? "").trim(),
      make: (cells[makeIdx] ?? "").trim(),
      model: (cells[modelIdx] ?? "").trim(),
      serviceCenter: (cells[centerIdx] ?? "").trim(),
    });
  }

  if (rows.length === 0) {
    throw new Error("No vehicle rows with AMPLink / RN numbers were found in the CSV.");
  }

  return rows;
}
