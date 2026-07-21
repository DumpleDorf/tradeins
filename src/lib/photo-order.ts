/**
 * Canonical display order for trade-in vehicle photos (AMP scrape labels).
 * Damage_* tiles follow these; unrecognized names come last (stable).
 */
export const VEHICLE_PHOTO_SORT_ORDER = [
  "FrontAngle",
  "ExtDriverSide",
  "ExtPassengerSide",
  "ReverseAngle",
  "IntFrontSeats",
  "Odometer",
] as const;

const DAMAGE_RANK = VEHICLE_PHOTO_SORT_ORDER.length;
const UNKNOWN_RANK = DAMAGE_RANK + 1;

function normalizePhotoLabel(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "");
}

/** Rank + secondary key for sorting by AMP title, filename, or storage object name. */
export function photoLabelRank(label: string): { rank: number; secondary: string } {
  const normalized = normalizePhotoLabel(label);
  if (!normalized) {
    return { rank: UNKNOWN_RANK, secondary: "" };
  }

  for (let i = 0; i < VEHICLE_PHOTO_SORT_ORDER.length; i += 1) {
    const name = VEHICLE_PHOTO_SORT_ORDER[i].toLowerCase();
    if (normalized === name || normalized.includes(name)) {
      return { rank: i, secondary: normalized };
    }
  }

  if (normalized.startsWith("damage_")) {
    return { rank: DAMAGE_RANK, secondary: normalized };
  }

  return { rank: UNKNOWN_RANK, secondary: normalized };
}

export function comparePhotoLabels(a: string, b: string): number {
  const ka = photoLabelRank(a);
  const kb = photoLabelRank(b);
  if (ka.rank !== kb.rank) return ka.rank - kb.rank;
  // Stable secondary sort for Damage_* and unknowns
  if (ka.rank >= DAMAGE_RANK) {
    const sec = ka.secondary.localeCompare(kb.secondary);
    if (sec !== 0) return sec;
  }
  return 0;
}

/** Stable sort using a label extractor (title, fileName, or URL basename). */
export function sortByPhotoLabel<T>(items: T[], getLabel: (item: T) => string): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const cmp = comparePhotoLabels(getLabel(a.item), getLabel(b.item));
      return cmp !== 0 ? cmp : a.index - b.index;
    })
    .map(({ item }) => item);
}

/** Best-effort label from a stored photo URL (object basename). */
export function photoLabelFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").pop() || url;
    return decodeURIComponent(base);
  } catch {
    const base = url.split("?")[0]?.split("/").pop() || url;
    try {
      return decodeURIComponent(base);
    } catch {
      return base;
    }
  }
}
