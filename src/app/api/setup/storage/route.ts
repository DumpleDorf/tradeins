import { NextResponse } from "next/server";
import { ensureVehiclePhotoBucket } from "@/lib/storage";

export async function POST(request: Request) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json(
      { error: "SETUP_SECRET not configured" },
      { status: 503 }
    );
  }

  const { secret } = await request.json();
  if (secret !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureVehiclePhotoBucket();
    return NextResponse.json({
      message: "Vehicle photo storage bucket is ready",
      bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "vehicle-photos",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
