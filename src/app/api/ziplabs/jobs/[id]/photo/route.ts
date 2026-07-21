import { NextRequest, NextResponse } from "next/server";
import { appendZiplabsJobPhoto } from "@/lib/ziplabs-jobs";
import type { AmpScrapedPhoto } from "@/lib/amp-mapping";

type Context = { params: Promise<{ id: string }> };

function corsHeaders(origin: string | null) {
  const allowed =
    origin === "https://amp.tesla.com" ||
    origin?.startsWith("http://localhost:") ||
    origin?.startsWith("https://localhost:");
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "https://amp.tesla.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest, context: Context) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const { id } = await context.params;

  const body = (await request.json().catch(() => null)) as { photo?: AmpScrapedPhoto } | null;
  const photo = body?.photo;
  if (!photo?.contentBase64 || !photo.title) {
    return NextResponse.json(
      { error: "photo with title and contentBase64 is required" },
      { status: 400, headers }
    );
  }

  const updated = await appendZiplabsJobPhoto(id, {
    title: photo.title,
    fileName: photo.fileName || `${photo.title}.jpg`,
    mimeType: photo.mimeType || "image/jpeg",
    contentBase64: photo.contentBase64,
  });

  if (!updated) {
    return NextResponse.json({ error: "Job not found" }, { status: 404, headers });
  }

  return NextResponse.json(
    { ok: true, photoCount: updated.photos?.length ?? 0 },
    { headers }
  );
}
