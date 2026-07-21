import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageListings } from "@/lib/rbac";
import { getZiplabsJob } from "@/lib/ziplabs-jobs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const job = await getZiplabsJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Never send base64 photo payloads to the browser (causes huge responses / 413 on import).
  const { photos, ...rest } = job;
  return NextResponse.json({
    ...rest,
    photoCount: photos?.length ?? 0,
    photoTitles: (photos ?? []).map((photo) => photo.title),
    debug: {
      ...job.debug,
      photoTitles: job.debug?.photoTitles ?? (photos ?? []).map((photo) => photo.title),
    },
  });
}
