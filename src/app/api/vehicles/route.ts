import { NextRequest, NextResponse } from "next/server";
import { Prisma, VehicleStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { vehicleSchema } from "@/lib/validations";
import { uploadVehiclePhoto } from "@/lib/storage";
import { sendNewListingNotification } from "@/lib/email";
import { formatPrice } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isPartnerView = session.user.role === "PARTNER";

  const where: Prisma.VehicleWhereInput = isPartnerView
    ? { status: VehicleStatus.AVAILABLE }
    : {};

  const status = searchParams.get("status");
  if (status && !isPartnerView) {
    where.status = status as VehicleStatus;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      listedBy: { select: { name: true, email: true } },
      reservations: isPartnerView
        ? false
        : {
            include: {
              partner: {
                select: {
                  name: true,
                  email: true,
                  partnerProfile: true,
                },
              },
            },
            orderBy: { reservedAt: "desc" },
            take: 1,
          },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const raw = Object.fromEntries(
      [...formData.entries()].filter(([key]) => key !== "photos")
    );

    const parsed = vehicleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...parsed.data,
        availableFrom: new Date(parsed.data.availableFrom),
        listedById: session.user.id,
      },
    });

    const photoFiles = formData.getAll("photos") as File[];
    const photoUrls: string[] = [];

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      if (file && file.size > 0) {
        try {
          const url = await uploadVehiclePhoto(file, vehicle.id);
          photoUrls.push(url);
          await prisma.vehiclePhoto.create({
            data: { vehicleId: vehicle.id, url, sortOrder: i },
          });
        } catch (uploadError) {
          console.error("Photo upload failed:", uploadError);
        }
      }
    }

    await createAuditLog({
      actorId: session.user.id,
      action: "VEHICLE_CREATED",
      entityType: "Vehicle",
      entityId: vehicle.id,
      metadata: { vin: vehicle.vin },
    });

    const notifySetting = await prisma.systemSetting.findUnique({
      where: { key: "notify_partners_on_new_listing" },
    });

    if (notifySetting?.value === "true") {
      const partners = await prisma.user.findMany({
        where: { role: "PARTNER", status: "ACTIVE" },
        select: { email: true },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://teslatradeins.com.au";
      await sendNewListingNotification({
        to: partners.map((p) => p.email),
        vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        listPrice: formatPrice(Number(vehicle.listPrice)),
        vehicleUrl: `${appUrl}/vehicles/${vehicle.id}`,
      });
    }

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
