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

const BUCKET_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

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

export async function ensureVehiclePhotoBucket(): Promise<void> {
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

export async function uploadVehiclePhoto(
  file: File,
  vehicleId: string
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

  await ensureVehiclePhotoBucket();

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

export async function uploadVehiclePhotos(
  files: File[],
  vehicleId: string,
  startSortOrder: number,
  savePhoto: (url: string, sortOrder: number) => Promise<void>
): Promise<string[]> {
  const warnings: string[] = [];
  let uploaded = 0;

  const ordered = sortByPhotoLabel(
    files.filter((file) => file && file.size > 0),
    (file) => file.name
  );

  for (const file of ordered) {
    try {
      const url = await uploadVehiclePhoto(file, vehicleId);
      await savePhoto(url, startSortOrder + uploaded);
      uploaded += 1;
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : `${file.name}: upload failed`;
      warnings.push(message);
      console.error("Photo upload failed:", uploadError);
    }
  }

  return warnings;
}
