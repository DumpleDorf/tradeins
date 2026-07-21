import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { mapAmpScrapeToVehicleInput, type AmpScrapedFields, type AmpScrapedPhoto } from "@/lib/amp-mapping";
import { sortByPhotoLabel } from "@/lib/photo-order";
import { vehicleSchema } from "@/lib/validations";
import { uploadVehiclePhotos } from "@/lib/storage";

type ImportBody = {
  rnNumber: string;
  site: string;
  fields: AmpScrapedFields;
  photos: AmpScrapedPhoto[];
};

function photosToFiles(photos: AmpScrapedPhoto[]): File[] {
  const ordered = sortByPhotoLabel(photos, (photo) => photo.title || photo.fileName);
  return ordered.map((photo, index) => {
    const bytes = Uint8Array.from(Buffer.from(photo.contentBase64, "base64"));
    const stem = (photo.title || photo.fileName || `photo-${index + 1}`).replace(
      /\.[^.]+$/,
      ""
    );
    const name = `${stem}.jpg`;
    return new File([bytes], name, { type: photo.mimeType || "image/jpeg" });
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.rnNumber || !body?.fields) {
    return NextResponse.json({ error: "rnNumber and fields are required" }, { status: 400 });
  }

  const mapped = mapAmpScrapeToVehicleInput({
    rnNumber: body.rnNumber,
    site: body.site ?? "",
    fields: body.fields,
  });

  const parsed = vehicleSchema.safeParse(mapped);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Mapped AMP fields failed validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const photos = Array.isArray(body.photos) ? body.photos : [];
  if (photos.length === 0) {
    return NextResponse.json(
      { error: "At least one image photo is required (PDFs/excluded docs do not count)." },
      { status: 400 }
    );
  }

  const existing = await prisma.vehicle.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Listing ${parsed.data.id} already exists`, id: existing.id },
      { status: 409 }
    );
  }

  const vinTaken = await prisma.vehicle.findUnique({
    where: { vin: parsed.data.vin },
    select: { id: true },
  });
  if (vinTaken) {
    return NextResponse.json(
      { error: `VIN already used by listing ${vinTaken.id}`, id: vinTaken.id },
      { status: 409 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...parsed.data,
      listedById: session.user.id,
    },
  });

  const files = photosToFiles(photos);
  const photoWarnings = await uploadVehiclePhotos(
    files,
    vehicle.id,
    0,
    async (url, sortOrder) => {
      await prisma.vehiclePhoto.create({
        data: { vehicleId: vehicle.id, url, sortOrder },
      });
    }
  );

  const photoCount = await prisma.vehiclePhoto.count({ where: { vehicleId: vehicle.id } });
  if (photoCount === 0) {
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    return NextResponse.json(
      {
        error: "Photo upload failed for all images; listing was not created.",
        photoWarnings,
      },
      { status: 500 }
    );
  }

  logAudit({
    actorId: session.user.id,
    action: "VEHICLE_CREATED",
    entityType: "Vehicle",
    entityId: vehicle.id,
    metadata: {
      source: "ziplabs_amp_import",
      vin: vehicle.vin,
      photoCount,
      photoWarnings,
    },
  });

  return NextResponse.json(
    {
      id: vehicle.id,
      photoCount,
      photoWarnings: photoWarnings.length ? photoWarnings : undefined,
    },
    { status: 201 }
  );
}
