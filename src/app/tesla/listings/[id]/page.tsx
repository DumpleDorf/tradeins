"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { VehicleDetailContent } from "@/components/vehicle-detail-content";
import { ListingPhotoManager, type ManagedPhoto } from "@/components/listing-photo-manager";
import { BackLink } from "@/components/back-link";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingOverlay } from "@/components/loading-overlay";
import {
  RequiredAsterisk,
  RequiredFieldsHint,
  VehicleFormFields,
} from "@/components/vehicle-form-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatApiError } from "@/lib/api-errors";
import { formatAuditActorLine, resolveWholesalerCompany } from "@/lib/audit-display";
import { validateVehiclePhotoFiles } from "@/lib/vehicle-photos";
import { type VehicleDetails } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type VehiclePhoto = {
  id: string;
  url: string;
};

type PartnerOption = {
  id: string;
  name: string;
  email: string;
  partnerProfile: { companyName: string } | null;
};

type ReservationInfo = {
  id: string;
  notes: string | null;
  reservedAt: string;
  status?: string;
  partner: {
    id: string;
    name: string;
    email: string;
    partnerProfile: { companyName: string; contactName: string } | null;
  };
};

type Vehicle = VehicleDetails & {
  id: string;
  status: string;
  photos: VehiclePhoto[];
  listedBy: { name: string };
  reservations?: ReservationInfo[];
};

type AuditEntry = {
  id: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  actor: {
    name: string;
    email: string;
    role: string;
    partnerProfile?: { companyName: string; contactName?: string } | null;
  } | null;
};

const NON_EDITABLE_STATUSES = ["RESERVED", "SOLD"];

function formatAuditAction(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}

export default function TeslaListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [photoWarning, setPhotoWarning] = useState("");
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);
  const [orderedPhotos, setOrderedPhotos] = useState<ManagedPhoto[]>([]);
  const [statusBusy, setStatusBusy] = useState(false);
  const [nextStatus, setNextStatus] = useState<"AVAILABLE" | "RESERVED" | "SOLD">("AVAILABLE");
  const [partnerId, setPartnerId] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  const loadVehicle = useCallback(async () => {
    const res = await fetch(`/api/vehicles/${id}`);
    const data = await res.json().catch(() => null);
    setVehicle(data?.id ? data : null);
    return data;
  }, [id]);

  const loadAudit = useCallback(async () => {
    const res = await fetch(`/api/vehicles/${id}/audit`);
    const data = await res.json().catch(() => []);
    setAuditLogs(Array.isArray(data) ? data : []);
  }, [id]);

  useEffect(() => {
    const warning = sessionStorage.getItem("listingPhotoWarning");
    if (warning) {
      setPhotoWarning(warning);
      sessionStorage.removeItem("listingPhotoWarning");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadVehicle(), loadAudit(), fetch("/api/partners").then((r) => r.json())])
      .then(([, , partnerData]) => {
        if (cancelled) return;
        setPartners(Array.isArray(partnerData) ? partnerData : []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadVehicle, loadAudit]);

  useEffect(() => {
    if (!vehicle) return;
    setOrderedPhotos(
      vehicle.photos
        .filter((photo) => !photosToRemove.includes(photo.id))
        .map((photo) => ({ id: photo.id, url: photo.url }))
    );
    const currentPartner =
      vehicle.reservations?.find((r) => r.status === "APPROVED")?.partner?.id ??
      vehicle.reservations?.[0]?.partner?.id;
    if (currentPartner) setPartnerId(currentPartner);
    if (vehicle.status === "AVAILABLE") setNextStatus("RESERVED");
    else if (vehicle.status === "RESERVED") setNextStatus("SOLD");
    else setNextStatus("AVAILABLE");
  }, [vehicle, photosToRemove]);

  const canEdit = vehicle && !NON_EDITABLE_STATUSES.includes(vehicle.status);
  const canDelete = canEdit;
  const latestReservation =
    vehicle?.reservations?.find((r) => r.status === "APPROVED") ?? vehicle?.reservations?.[0];
  const currentWholesalerId = latestReservation?.partner?.id ?? "";
  const showCurrentWholesaler =
    !!latestReservation && (vehicle?.status === "RESERVED" || vehicle?.status === "SOLD");
  const needsPartner = nextStatus === "RESERVED" || nextStatus === "SOLD";

  function cancelEdit() {
    setEditing(false);
    setPhotosToRemove([]);
    setError("");
  }

  function startEdit() {
    if (!vehicle) return;
    setOrderedPhotos(vehicle.photos.map((photo) => ({ id: photo.id, url: photo.url })));
    setPhotosToRemove([]);
    setEditing(true);
  }

  function handleRemovePhoto(photoId: string) {
    setPhotosToRemove((ids) => [...ids, photoId]);
    setOrderedPhotos((photos) => photos.filter((photo) => photo.id !== photoId));
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    photosToRemove.forEach((photoId) => formData.append("removePhotoIds", photoId));
    orderedPhotos.forEach((photo) => formData.append("photoOrder", photo.id));

    const photoFiles = (formData.getAll("photos") as File[]).filter((file) => file.size > 0);
    if (orderedPhotos.length === 0 && photoFiles.length === 0) {
      setError("At least one photo is required.");
      setSaving(false);
      return;
    }

    const photoErrors = validateVehiclePhotoFiles(photoFiles);
    if (photoErrors.length > 0) {
      setError(photoErrors.join(" "));
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setError(formatApiError(data, "Failed to update listing."));
      setSaving(false);
      return;
    }

    setVehicle(data);
    setEditing(false);
    setPhotosToRemove([]);
    setSaving(false);
    await loadAudit();

    if (data.photoWarnings?.length) {
      setPhotoWarning(data.photoWarnings.join(" "));
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to remove listing");
      setRemoving(false);
      return;
    }

    router.push("/tesla/listings");
    router.refresh();
  }

  async function handleStatusChange() {
    if (!vehicle) return;
    if (needsPartner && !partnerId) {
      setError("Select a wholesaler when moving to Reserved or Sold.");
      return;
    }

    setStatusBusy(true);
    setError("");

    const res = await fetch(`/api/vehicles/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        partnerId: needsPartner ? partnerId : undefined,
        comment: statusComment.trim() || undefined,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to update status");
      setStatusBusy(false);
      return;
    }

    setVehicle(data);
    setStatusComment("");
    setStatusBusy(false);
    await loadAudit();
  }

  if (loading) {
    return (
      <PageShell>
        <LoadingOverlay show label="Loading listing..." />
      </PageShell>
    );
  }

  if (!vehicle?.id) {
    return (
      <PageShell>
        <main className="mx-auto max-w-3xl py-16 text-center">
          <p>Listing not found.</p>
          <BackLink href="/tesla/listings" label="Back to listings" className="mt-4" />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <LoadingOverlay
        show={saving || removing || statusBusy}
        label={
          removing
            ? "Removing listing..."
            : statusBusy
              ? "Updating status..."
              : "Saving changes..."
        }
      />

      <BackLink href="/tesla/listings" label="Back to listings" />

      <div className={cn("mt-6", editing && "mx-auto max-w-2xl")}>
        <Disclaimer variant="listing" />

        {photoWarning && (
          <p className="mt-4 rounded-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Listing saved, but photos could not be uploaded: {photoWarning}
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {editing ? (
          <form onSubmit={handleEditSubmit} className="mt-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-semibold">
                Edit {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
            </div>

            <RequiredFieldsHint />

            <VehicleFormFields defaultValues={vehicle} idPrefix="edit-" showPhotos />

            <div className="space-y-3 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
              <h2 className="font-semibold">
                Photos <RequiredAsterisk />
              </h2>
              <ListingPhotoManager
                photos={orderedPhotos}
                onChange={setOrderedPhotos}
                onRemove={handleRemovePhoto}
              />
              {photosToRemove.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {photosToRemove.length} photo(s) will be removed when you save.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                At least one photo is required. Existing photos count toward this requirement;
                use the file input above to add more.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-8 animate-slide-up space-y-8">
            <VehicleDetailContent
              vehicle={vehicle}
              subtitle={`VIN: ${vehicle.vin}`}
              actions={
                <>
                  {canEdit && (
                    <Button variant="outline" onClick={startEdit}>
                      Edit listing
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                      Remove listing
                    </Button>
                  )}
                </>
              }
              sidebar={
                showConfirm ? (
                  <div className="space-y-3 rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                    <p className="text-sm">
                      Remove this listing permanently? It will be deleted from partner inventory
                      and cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="destructive" onClick={handleRemove} disabled={removing}>
                        {removing ? "Removing..." : "Confirm remove"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
                    <h2 className="font-semibold">Status</h2>
                    <p className="text-sm text-muted-foreground">
                      Change this listing&apos;s status. A reservation is an intention to buy until
                      staff confirm the sale.
                    </p>
                    {showCurrentWholesaler && latestReservation && (
                      <div className="rounded-sm border border-border/60 bg-background/40 p-3 text-sm">
                        <p className="font-medium text-muted-foreground">
                          {vehicle.status === "SOLD" ? "Sold to:" : "Currently reserved by:"}
                        </p>
                        <p className="mt-0.5 font-medium">
                          {latestReservation.partner.partnerProfile?.companyName ??
                            latestReservation.partner.name}
                        </p>
                        <p className="text-muted-foreground">{latestReservation.partner.email}</p>
                        {latestReservation.notes && (
                          <p className="mt-2 text-muted-foreground">
                            Notes: {latestReservation.notes}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="next-status">Move to</Label>
                      <select
                        id="next-status"
                        className="flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm"
                        value={nextStatus}
                        onChange={(e) =>
                          setNextStatus(e.target.value as "AVAILABLE" | "RESERVED" | "SOLD")
                        }
                      >
                        {vehicle.status !== "AVAILABLE" && (
                          <option value="AVAILABLE">Available (re-list / release)</option>
                        )}
                        {vehicle.status !== "RESERVED" && (
                          <option value="RESERVED">Reserved</option>
                        )}
                        {vehicle.status !== "SOLD" && <option value="SOLD">Sold</option>}
                      </select>
                    </div>
                    {needsPartner && (
                      <div className="space-y-2">
                        <Label htmlFor="partner-select">Wholesaler</Label>
                        <select
                          id="partner-select"
                          className="flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm"
                          value={partnerId}
                          onChange={(e) => setPartnerId(e.target.value)}
                          required
                        >
                          <option value="">Select wholesaler</option>
                          {partners.map((partner) => {
                            const company =
                              partner.partnerProfile?.companyName ?? partner.name;
                            const isCurrent = partner.id === currentWholesalerId;
                            const currentSuffix =
                              isCurrent && vehicle.status === "SOLD"
                                ? " (currently sold to)"
                                : isCurrent && vehicle.status === "RESERVED"
                                  ? " (currently reserved)"
                                  : "";
                            return (
                              <option key={partner.id} value={partner.id}>
                                {company} ({partner.email}){currentSuffix}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="status-comment">Comment (optional)</Label>
                      <textarea
                        id="status-comment"
                        rows={3}
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder="Add a note for the audit log..."
                        className="flex w-full rounded-sm border border-border bg-card px-3 py-2 text-sm"
                      />
                    </div>
                    <Button className="w-full" onClick={handleStatusChange} disabled={statusBusy}>
                      {statusBusy ? "Updating..." : "Update status"}
                    </Button>
                  </div>
                )
              }
            />

            <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold">Vehicle audit log</h2>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events for this vehicle yet.</p>
              ) : (
                <ul className="space-y-3">
                  {auditLogs.map((log) => {
                    const wholesalerCompany =
                      log.actor?.role === "PARTNER"
                        ? null
                        : resolveWholesalerCompany(log.actor, log.metadata);
                    const wholesalerPerson =
                      typeof log.metadata?.partnerUserName === "string" &&
                      log.metadata.partnerUserName
                        ? String(log.metadata.partnerUserName)
                        : typeof log.metadata?.partnerContactName === "string" &&
                            log.metadata.partnerContactName
                          ? String(log.metadata.partnerContactName)
                          : null;

                    return (
                    <li
                      key={log.id}
                      className="rounded-sm border border-border/50 bg-background/30 px-3 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium capitalize">{formatAuditAction(log.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-AU")}
                        </p>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {formatAuditActorLine(log.actor, log.metadata)}
                      </p>
                      {wholesalerCompany && (
                          <p className="mt-1 text-sm">
                            Wholesaler: {wholesalerCompany}
                            {wholesalerPerson ? ` · ${wholesalerPerson}` : ""}
                          </p>
                        )}
                      {typeof log.metadata?.comment === "string" && log.metadata.comment && (
                        <p className="mt-2 text-muted-foreground">Comment: {log.metadata.comment}</p>
                      )}
                      {typeof log.metadata?.notes === "string" && log.metadata.notes && (
                        <p className="mt-2 text-muted-foreground">Notes: {log.metadata.notes}</p>
                      )}
                      {typeof log.metadata?.fromStatus === "string" &&
                        typeof log.metadata?.toStatus === "string" && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {String(log.metadata.fromStatus)} → {String(log.metadata.toStatus)}
                          </p>
                        )}
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
