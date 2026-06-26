const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "vehicle-photos";

export async function uploadVehiclePhoto(
  file: File,
  vehicleId: string
): Promise<string> {
  if (!supabaseUrl || !supabaseKey) {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${file.type};base64,${base64}`;
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${vehicleId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    }
  );

  if (!uploadRes.ok) {
    throw new Error("Failed to upload image");
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
