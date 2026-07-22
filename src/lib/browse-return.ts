/** Build the current browse URL (path + query) to restore after viewing a detail page. */
export function getBrowseReturnPath(pathname: string, searchParams: { toString(): string }) {
  const qs = searchParams.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Append a `from` query param so detail "Back" can restore browse state (e.g. ?page=N). */
export function withBrowseReturn(detailHref: string, returnPath: string) {
  const params = new URLSearchParams();
  params.set("from", returnPath);
  const separator = detailHref.includes("?") ? "&" : "?";
  return `${detailHref}${separator}${params.toString()}`;
}

const ALLOWED_BROWSE_PATHS = new Set(["/inventory", "/tesla/listings"]);

/**
 * Resolve a safe return URL from the `from` query param.
 * Only allows known browse listing paths (with optional query string).
 */
export function resolveBrowseReturn(from: string | null | undefined, fallback: string) {
  if (!from) return fallback;
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("://")) {
    return fallback;
  }
  const pathOnly = from.split("?")[0] ?? from;
  if (!ALLOWED_BROWSE_PATHS.has(pathOnly)) return fallback;
  return from;
}
