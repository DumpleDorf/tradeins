import { NextRequest, NextResponse } from "next/server";
import { completeZiplabsJob } from "@/lib/ziplabs-jobs";
import type { AmpScrapedFields, AmpScrapedPhoto } from "@/lib/amp-mapping";

type Context = { params: Promise<{ id: string }> };

function corsHeaders(origin: string | null) {
  // Allow AMP userscript to POST scrape results back to Trade-Ins.
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

  const body = (await request.json().catch(() => null)) as
    | {
        ok: true;
        fields: AmpScrapedFields;
        photos?: AmpScrapedPhoto[];
      }
    | { ok: false; error?: string }
    | null;

  if (!body || typeof body.ok !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers });
  }

  const updated = body.ok
    ? await completeZiplabsJob(id, {
        ok: true,
        fields: body.fields,
        photos: Array.isArray(body.photos) ? body.photos : [],
      })
    : await completeZiplabsJob(id, {
        ok: false,
        error: body.error || "AMP scrape failed",
      });

  if (!updated) {
    return NextResponse.json({ error: "Job not found" }, { status: 404, headers });
  }

  return NextResponse.json({ ok: true }, { headers });
}
