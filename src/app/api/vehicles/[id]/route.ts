import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { vehicleSchema } from "@/lib/validations";
import { uploadVehiclePhoto } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      listedBy: { select: { name: true } },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    session.user.role === "PARTNER" &&
    vehicle.status !== "AVAILABLE"
  ) {
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
        [...formData.entries()].filter(([key]) => key !== "photos")
      );

      const photoFiles = formData.getAll("photos") as File[];
      const existingPhotos = await prisma.vehiclePhoto.count({
        where: { vehicleId: id },
      });

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        if (file && file.size > 0) {
          try {
            const url = await uploadVehiclePhoto(file, id);
            await prisma.vehiclePhoto.create({
              data: {
                vehicleId: id,
                url,
                sortOrder: existingPhotos + i,
              },
            });
          } catch (uploadError) {
            console.error("Photo upload failed:", uploadError);
            return NextResponse.json(
              {
                error:
                  uploadError instanceof Error
                    ? uploadError.message
                    : "Failed to upload photos",
              },
              { status: 500 }
            );
          }
        }
      }
    } else {
      data = await request.json();
    }

    const parsed = vehicleSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updateData = {
      ...parsed.data,
    };

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "VEHICLE_UPDATED",
      entityType: "Vehicle",
      entityId: id,
    });

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
