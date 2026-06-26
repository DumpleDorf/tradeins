import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageListings } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: "notify_partners_on_new_listing" },
  });

  return NextResponse.json({
    notifyPartnersOnNewListing: setting?.value === "true",
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { notifyPartnersOnNewListing } = await request.json();

  const setting = await prisma.systemSetting.upsert({
    where: { key: "notify_partners_on_new_listing" },
    update: { value: String(notifyPartnersOnNewListing) },
    create: {
      key: "notify_partners_on_new_listing",
      value: String(notifyPartnersOnNewListing),
    },
  });

  return NextResponse.json({
    notifyPartnersOnNewListing: setting.value === "true",
  });
}
