import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canManageListings } from "@/lib/rbac";
import { mapAmpScrapeToVehicleInput } from "@/lib/amp-mapping";
import { getZiplabsJob } from "@/lib/ziplabs-jobs";
import { vehicleSchema } from "@/lib/validations";
import { uploadVehiclePhotos } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

function photosToFiles(
  photos: NonNullable<Awaited<ReturnType<typeof getZiplabsJob>>>["photos"]
): File[] {
  return (photos ?? [])
    .filter((photo) => Boolean(photo.contentBase64))
    .map((photo, index) => {
      const bytes = Uint8Array.from(Buffer.from(photo.contentBase64, "base64"));
      const name = photo.fileName || `photo-${index + 1}.jpg`;
      return new File([bytes], name, { type: photo.mimeType || "image/jpeg" });
    });
}

/** Create a listing from an already-scraped job (photos stay server-side — avoids 413). */
export async function POST(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user || !canManageListings(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const job = await getZiplabsJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.status !== "scraped" || !job.fields) {
    return NextResponse.json(
      { error: job.error || "Job is not ready to import" },
      { status: 400 }
    );
  }

  const mapped = mapAmpScrapeToVehicleInput({
    rnNumber: job.rnNumber,
    site: job.site,
    fields: job.fields,
  });

  const parsed = vehicleSchema.safeParse(mapped);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Mapped AMP fields failed validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const photos = (job.photos ?? []).filter((photo) => Boolean(photo.contentBase64));
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

  const photoWarnings = await uploadVehiclePhotos(
    photosToFiles(photos),
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
      jobId: job.id,
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
      photoTitles: photos.map((photo) => photo.title),
    },
    { status: 201 }
  );
}
