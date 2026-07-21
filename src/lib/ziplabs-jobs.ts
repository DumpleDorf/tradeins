import { prisma } from "@/lib/db";
import type { AmpScrapedFields, AmpScrapedPhoto } from "@/lib/amp-mapping";

export type ZiplabsJobRecord = {
  id: string;
  rnNumber: string;
  site: string;
  ampUrl: string;
  status: "pending" | "scraped" | "failed";
  error?: string;
  fields?: AmpScrapedFields;
  photos?: AmpScrapedPhoto[];
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

export async function completeZiplabsJob(
  id: string,
  result:
    | { ok: true; fields: AmpScrapedFields; photos: AmpScrapedPhoto[] }
    | { ok: false; error: string }
): Promise<ZiplabsJobRecord | null> {
  const existing = await getZiplabsJob(id);
  if (!existing) return null;

  const updated: ZiplabsJobRecord = {
    ...existing,
    status: result.ok ? "scraped" : "failed",
    error: result.ok ? undefined : result.error,
    fields: result.ok ? result.fields : existing.fields,
    photos: result.ok ? result.photos : existing.photos,
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
