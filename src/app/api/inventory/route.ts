import { NextRequest, NextResponse } from "next/server";
import { VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { queryVehicleBrowse } from "@/lib/vehicle-browse-query";
import { inventoryFiltersSchema } from "@/lib/validations";

const availableWhere = {
  status: VehicleStatus.AVAILABLE,
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawParams = Object.fromEntries(new URL(request.url).searchParams);
    const params = Object.fromEntries(
      Object.entries(rawParams).filter(([, value]) => value !== "")
    );
    const parsed = inventoryFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    }

    const result = await queryVehicleBrowse(parsed.data, availableWhere, availableWhere);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Inventory browse failed:", error);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}
