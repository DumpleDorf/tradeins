const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "vehicle-photos";

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

export async function ensureVehiclePhotoBucket(): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  const checkRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
    headers: supabaseHeaders(),
  });

  if (checkRes.ok) {
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
      file_size_limit: 10485760,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
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
  if (!supabaseUrl || !supabaseKey) {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${file.type};base64,${base64}`;
  }

  await ensureVehiclePhotoBucket();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${vehicleId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(file.type),
        "x-upsert": "true",
      },
      body: file,
    }
  );

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`Failed to upload image: ${body}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
