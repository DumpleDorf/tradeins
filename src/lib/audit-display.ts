/** User-facing role labels. DB enum `PARTNER` stays unchanged. */
export function formatUserRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "PARTNER":
      return "Wholesaler";
    case "TESLA_EMPLOYEE":
      return "Tesla Employee";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return role ? role.replaceAll("_", " ") : "Unknown";
  }
}

export type AuditActorLike = {
  name: string;
  role: string;
  partnerProfile?: { companyName: string } | null;
} | null;

export type AuditMetadataLike = Record<string, unknown> | null | undefined;

function metaString(metadata: AuditMetadataLike, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Company for a wholesaler action: prefer audit metadata, then actor profile. */
export function resolveWholesalerCompany(
  actor: AuditActorLike,
  metadata?: AuditMetadataLike
): string | null {
  return (
    metaString(metadata, "partnerCompany") ||
    actor?.partnerProfile?.companyName?.trim() ||
    null
  );
}

/**
 * Actor line for audit UIs.
 * Wholesaler example: `Acme Motors (Wholesaler)`
 * Tesla example: `Kane Murray (Tesla Employee)`
 */
export function formatAuditActorLine(
  actor: AuditActorLike,
  metadata?: AuditMetadataLike
): string {
  if (!actor) return "System";

  const roleLabel = formatUserRoleLabel(actor.role);

  if (actor.role === "PARTNER") {
    const company = resolveWholesalerCompany(actor, metadata);
    return company ? `${company} (${roleLabel})` : `(${roleLabel})`;
  }

  return `${actor.name} (${roleLabel})`;
}
