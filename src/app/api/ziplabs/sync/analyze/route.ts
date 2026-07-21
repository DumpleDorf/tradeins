import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";
import { buildZiplabsSyncPlan } from "@/lib/ziplabs-sync-plan";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    rnNumbers?: string[];
  } | null;

  const rnNumbers = Array.isArray(body?.rnNumbers)
    ? body.rnNumbers.filter((rn) => typeof rn === "string" && rn.trim())
    : [];

  if (rnNumbers.length === 0) {
    return NextResponse.json({ error: "rnNumbers required" }, { status: 400 });
  }

  const websiteVehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      status: true,
      make: true,
      model: true,
      year: true,
    },
  });

  const plan = buildZiplabsSyncPlan(rnNumbers, websiteVehicles);

  return NextResponse.json({
    reportCount: new Set(rnNumbers.map((rn) => rn.trim().toUpperCase())).size,
    websiteCount: websiteVehicles.length,
    ...plan,
  });
}
