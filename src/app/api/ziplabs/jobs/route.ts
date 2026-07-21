import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageListings } from "@/lib/rbac";
import { createZiplabsJob } from "@/lib/ziplabs-jobs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    rnNumber?: string;
    site?: string;
    ampUrl?: string;
  } | null;

  if (!body?.rnNumber || !body?.ampUrl) {
    return NextResponse.json({ error: "rnNumber and ampUrl are required" }, { status: 400 });
  }

  const job = await createZiplabsJob({
    rnNumber: body.rnNumber,
    site: body.site ?? "",
    ampUrl: body.ampUrl,
  });

  return NextResponse.json(job, { status: 201 });
}
