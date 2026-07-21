import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageListings } from "@/lib/rbac";
import { getZiplabsLastSync, saveZiplabsLastSync, type ZiplabsLastSyncResult } from "@/lib/ziplabs-sync-store";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await getZiplabsLastSync();
  return NextResponse.json({ result });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as ZiplabsLastSyncResult | null;
  if (!body || !body.ranAt || !Array.isArray(body.inconsistencies)) {
    return NextResponse.json({ error: "Invalid sync result payload" }, { status: 400 });
  }

  await saveZiplabsLastSync({
    ranAt: body.ranAt,
    fileName: body.fileName,
    reportCount: body.reportCount ?? 0,
    created: body.created ?? [],
    deleted: body.deleted ?? [],
    createErrors: body.createErrors ?? [],
    inconsistencies: body.inconsistencies ?? [],
  });

  return NextResponse.json({ ok: true });
}
