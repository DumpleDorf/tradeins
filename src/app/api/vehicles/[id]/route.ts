import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { vehicleSchema } from "@/lib/validations";
import { uploadVehiclePhotos } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

async function getVehicleResponse(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      listedBy: { select: { name: true } },
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vehicle = await getVehicleResponse(id);

    if (!vehicle) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.user.role === "PARTNER" && vehicle.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Vehicle fetch failed:", error);
    return NextResponse.json({ error: "Failed to load vehicle" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (["SOLD", "RESERVED"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Cannot edit vehicle after approval stage" },
      { status: 400 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let data: Record<string, unknown> = {};
    let photoWarnings: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = Object.fromEntries(
        [...formData.entries()].filter(
          ([key]) => key !== "photos" && key !== "removePhotoIds" && key !== "photoOrder"
        )
      );

      const removePhotoIds = formData.getAll("removePhotoIds").map(String).filter(Boolean);
      if (removePhotoIds.length > 0) {
        await prisma.vehiclePhoto.deleteMany({
          where: {
            id: { in: removePhotoIds },
            vehicleId: id,
          },
        });
      }

      const photoOrder = formData.getAll("photoOrder").map(String).filter(Boolean);
      if (photoOrder.length > 0) {
        await Promise.all(
          photoOrder.map((photoId, index) =>
            prisma.vehiclePhoto.updateMany({
              where: { id: photoId, vehicleId: id },
              data: { sortOrder: index },
            })
          )
        );
      }

      const photoFiles = formData.getAll("photos") as File[];
      const existingPhotos = await prisma.vehiclePhoto.count({
        where: { vehicleId: id },
      });

      photoWarnings = await uploadVehiclePhotos(
        photoFiles,
        id,
        existingPhotos,
        async (url, sortOrder) => {
          await prisma.vehiclePhoto.create({
            data: { vehicleId: id, url, sortOrder },
          });
        }
      );
    } else {
      const body = await request.json();
      data = body;
      if (Array.isArray(body.removePhotoIds) && body.removePhotoIds.length > 0) {
        await prisma.vehiclePhoto.deleteMany({
          where: {
            id: { in: body.removePhotoIds },
            vehicleId: id,
          },
        });
        delete data.removePhotoIds;
      }
      if (Array.isArray(body.photoOrder) && body.photoOrder.length > 0) {
        await Promise.all(
          body.photoOrder.map((photoId: string, index: number) =>
            prisma.vehiclePhoto.updateMany({
              where: { id: photoId, vehicleId: id },
              data: { sortOrder: index },
            })
          )
        );
        delete data.photoOrder;
      }
    }

    const parsed = vehicleSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.vin && parsed.data.vin !== existing.vin) {
      const vinTaken = await prisma.vehicle.findUnique({
        where: { vin: parsed.data.vin },
      });
      if (vinTaken) {
        return NextResponse.json({ error: "VIN already in use" }, { status: 409 });
      }
    }

    if (Object.keys(parsed.data).length > 0) {
      await prisma.vehicle.update({
        where: { id },
        data: parsed.data,
      });
    }

    const photoCount = await prisma.vehiclePhoto.count({ where: { vehicleId: id } });
    if (photoCount === 0) {
      return NextResponse.json(
        { error: "At least one photo is required on every listing" },
        { status: 400 }
      );
    }

    logAudit({
      actorId: session.user.id,
      action: "VEHICLE_UPDATED",
      entityType: "Vehicle",
      entityId: id,
    });

    const vehicle = await getVehicleResponse(id);
    return NextResponse.json({
      ...vehicle,
      photoWarnings: photoWarnings.length > 0 ? photoWarnings : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "RESERVED" || existing.status === "SOLD") {
    return NextResponse.json(
      { error: "Cannot delete vehicle in current status" },
      { status: 400 }
    );
  }

  await prisma.vehicle.delete({ where: { id } });

  logAudit({
    actorId: session.user.id,
    action: "VEHICLE_DELETED",
    entityType: "Vehicle",
    entityId: id,
    metadata: { vin: existing.vin },
  });

  return NextResponse.json({ success: true });
}
