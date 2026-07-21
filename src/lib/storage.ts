import { sortByPhotoLabel } from "@/lib/photo-order";
import {
  formatPhotoUploadError,
  MAX_VEHICLE_PHOTO_BYTES,
  validateVehiclePhotoFile,
} from "@/lib/vehicle-photos";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "vehicle-photos";

/** Parallel Supabase uploads — high enough for speed, low enough to avoid throttling. */
const PHOTO_UPLOAD_CONCURRENCY = 4;

const BUCKET_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

/** Cache bucket ensure so we don't GET+PUT settings on every photo. */
let bucketReadyPromise: Promise<void> | null = null;

function supabaseHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${supabaseKey}`,
    apikey: supabaseKey!,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

async function syncVehiclePhotoBucket(): Promise<void> {
  await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
    method: "PUT",
    headers: {
      ...supabaseHeaders("application/json"),
    },
    body: JSON.stringify({
      public: true,
      file_size_limit: MAX_VEHICLE_PHOTO_BYTES,
      allowed_mime_types: BUCKET_MIME_TYPES,
    }),
  });
}

async function ensureVehiclePhotoBucketOnce(): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  const checkRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
    headers: supabaseHeaders(),
  });

  if (checkRes.ok) {
    await syncVehiclePhotoBucket();
    return;
  }

  const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      ...supabaseHeaders("application/json"),
    },
    body: JSON.stringify({
      name: bucket,
      public: true,
      file_size_limit: MAX_VEHICLE_PHOTO_BYTES,
      allowed_mime_types: BUCKET_MIME_TYPES,
    }),
  });

  if (!createRes.ok && createRes.status !== 409) {
    const body = await createRes.text();
    throw new Error(`Failed to create storage bucket: ${body}`);
  }
}

export async function ensureVehiclePhotoBucket(): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  if (!bucketReadyPromise) {
    bucketReadyPromise = ensureVehiclePhotoBucketOnce().catch((error) => {
      bucketReadyPromise = null;
      throw error;
    });
  }

  await bucketReadyPromise;
}

export async function uploadVehiclePhoto(
  file: File,
  vehicleId: string,
  options?: { skipBucketEnsure?: boolean }
): Promise<string> {
  const validationError = validateVehiclePhotoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!supabaseUrl || !supabaseKey) {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${file.type || "image/jpeg"};base64,${base64}`;
  }

  if (!options?.skipBucketEnsure) {
    await ensureVehiclePhotoBucket();
  }

  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  // Keep a sanitized stem in the object key so sortOrder migrations can match AMP labels.
  const stem = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  const labelPart = stem ? `${stem}-` : "";
  const path = `${vehicleId}/${Date.now()}-${labelPart}${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || "image/jpeg";

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(contentType),
        "x-upsert": "true",
      },
      body: file,
    }
  );

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(formatPhotoUploadError(file.name, body));
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const poolSize = Math.min(concurrency, Math.max(items.length, 1));
  await Promise.all(Array.from({ length: poolSize }, () => runWorker()));
  return results;
}

export async function uploadVehiclePhotos(
  files: File[],
  vehicleId: string,
  startSortOrder: number,
  savePhoto: (url: string, sortOrder: number) => Promise<void>
): Promise<string[]> {
  const warnings: string[] = [];

  const ordered = sortByPhotoLabel(
    files.filter((file) => file && file.size > 0),
    (file) => file.name
  );

  if (ordered.length === 0) {
    return warnings;
  }

  // One bucket ensure for the whole batch (was previously N× GET+PUT).
  await ensureVehiclePhotoBucket();

  type UploadOutcome =
    | { ok: true; url: string; index: number }
    | { ok: false; warning: string; index: number };

  const outcomes = await mapWithConcurrency(
    ordered,
    PHOTO_UPLOAD_CONCURRENCY,
    async (file, index): Promise<UploadOutcome> => {
      try {
        const url = await uploadVehiclePhoto(file, vehicleId, { skipBucketEnsure: true });
        return { ok: true, url, index };
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : `${file.name}: upload failed`;
        console.error("Photo upload failed:", uploadError);
        return { ok: false, warning: message, index };
      }
    }
  );

  // Persist successes in ordered index order so sortOrder stays contiguous.
  let uploaded = 0;
  for (const outcome of outcomes) {
    if (!outcome.ok) {
      warnings.push(outcome.warning);
      continue;
    }
    try {
      await savePhoto(outcome.url, startSortOrder + uploaded);
      uploaded += 1;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : `Failed to save photo ${outcome.index + 1}`;
      warnings.push(message);
      console.error("Photo save failed:", saveError);
    }
  }

  return warnings;
}
