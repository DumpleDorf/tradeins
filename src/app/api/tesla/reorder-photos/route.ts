import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";
import { reorderAllVehiclePhotos } from "@/lib/reorder-vehicle-photos";

/** One-time / admin: rewrite all VehiclePhoto.sortOrder using AMP label ranking. */
export async function POST() {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await reorderAllVehiclePhotos(prisma);
    return NextResponse.json(result);
  } catch (error) {
    console.error("reorder-photos failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reorder photos" },
      { status: 500 }
    );
  }
}
