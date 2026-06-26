import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { vehicleSchema } from "@/lib/validations";
import { uploadVehiclePhoto } from "@/lib/storage";

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

  const vehicle = await getVehicleResponse(id);

  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role === "PARTNER" && vehicle.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
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

  if (["SOLD", "PENDING_APPROVAL"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Cannot edit vehicle after approval stage" },
      { status: 400 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let data: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = Object.fromEntries(
        [...formData.entries()].filter(
          ([key]) => key !== "photos" && key !== "removePhotoIds"
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

      const photoFiles = formData.getAll("photos") as File[];
      const existingPhotos = await prisma.vehiclePhoto.count({
        where: { vehicleId: id },
      });

      let uploaded = 0;

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        if (file && file.size > 0) {
          try {
            const url = await uploadVehiclePhoto(file, id);
            await prisma.vehiclePhoto.create({
              data: {
                vehicleId: id,
                url,
                sortOrder: existingPhotos + uploaded,
              },
            });
            uploaded += 1;
          } catch (uploadError) {
            console.error("Photo upload failed:", uploadError);
          }
        }
      }
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

    await createAuditLog({
      actorId: session.user.id,
      action: "VEHICLE_UPDATED",
      entityType: "Vehicle",
      entityId: id,
    });

    const vehicle = await getVehicleResponse(id);
    return NextResponse.json(vehicle);
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

  if (existing.status === "PENDING_APPROVAL" || existing.status === "SOLD") {
    return NextResponse.json(
      { error: "Cannot delete vehicle in current status" },
      { status: 400 }
    );
  }

  await prisma.vehicle.delete({ where: { id } });

  await createAuditLog({
    actorId: session.user.id,
    action: "VEHICLE_DELETED",
    entityType: "Vehicle",
    entityId: id,
    metadata: { vin: existing.vin },
  });

  return NextResponse.json({ success: true });
}
