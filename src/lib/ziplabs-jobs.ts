import { prisma } from "@/lib/db";
import type { AmpScrapedFields, AmpScrapedPhoto } from "@/lib/amp-mapping";
import { sortByPhotoLabel } from "@/lib/photo-order";

export type ZiplabsJobDebug = {
  tileTitles?: string[];
  photoTitles?: string[];
  failures?: string[];
};

export type ZiplabsJobRecord = {
  id: string;
  rnNumber: string;
  site: string;
  ampUrl: string;
  status: "pending" | "scraped" | "failed";
  error?: string;
  fields?: AmpScrapedFields;
  photos?: AmpScrapedPhoto[];
  debug?: ZiplabsJobDebug;
  createdAt: string;
  updatedAt: string;
};

function jobKey(id: string) {
  return `ziplabs_job_${id}`;
}

export async function createZiplabsJob(input: {
  rnNumber: string;
  site: string;
  ampUrl: string;
}): Promise<ZiplabsJobRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record: ZiplabsJobRecord = {
    id,
    rnNumber: input.rnNumber,
    site: input.site,
    ampUrl: input.ampUrl,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await prisma.systemSetting.create({
    data: {
      key: jobKey(id),
      value: JSON.stringify(record),
    },
  });

  return record;
}

export async function getZiplabsJob(id: string): Promise<ZiplabsJobRecord | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key: jobKey(id) } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as ZiplabsJobRecord;
  } catch {
    return null;
  }
}

export async function appendZiplabsJobPhoto(
  id: string,
  photo: AmpScrapedPhoto
): Promise<ZiplabsJobRecord | null> {
  const existing = await getZiplabsJob(id);
  if (!existing) return null;

  const photos = sortByPhotoLabel([...(existing.photos ?? []), photo], (p) => p.title || p.fileName);
  const updated: ZiplabsJobRecord = {
    ...existing,
    photos,
    updatedAt: new Date().toISOString(),
  };

  await prisma.systemSetting.update({
    where: { key: jobKey(id) },
    data: { value: JSON.stringify(updated) },
  });

  return updated;
}

export async function completeZiplabsJob(
  id: string,
  result:
    | {
        ok: true;
        fields: AmpScrapedFields;
        photos?: AmpScrapedPhoto[];
        debug?: ZiplabsJobDebug;
      }
    | { ok: false; error: string; debug?: ZiplabsJobDebug }
): Promise<ZiplabsJobRecord | null> {
  const existing = await getZiplabsJob(id);
  if (!existing) return null;

  // Prefer photos already uploaded one-by-one; ignore empty base64 stubs from complete.
  const incomingPhotos = (result.ok ? result.photos : undefined)?.filter(
    (photo) => Boolean(photo.contentBase64)
  );
  const rawPhotos =
    existing.photos && existing.photos.length > 0
      ? existing.photos
      : incomingPhotos && incomingPhotos.length > 0
        ? incomingPhotos
        : existing.photos;
  const photos = rawPhotos
    ? sortByPhotoLabel(rawPhotos, (p) => p.title || p.fileName)
    : rawPhotos;

  const updated: ZiplabsJobRecord = {
    ...existing,
    status: result.ok ? "scraped" : "failed",
    error: result.ok ? undefined : result.error,
    fields: result.ok ? result.fields : existing.fields,
    photos,
    debug: result.debug ?? existing.debug,
    updatedAt: new Date().toISOString(),
  };

  await prisma.systemSetting.update({
    where: { key: jobKey(id) },
    data: { value: JSON.stringify(updated) },
  });

  return updated;
}

export async function deleteZiplabsJob(id: string) {
  await prisma.systemSetting.deleteMany({ where: { key: jobKey(id) } });
}
