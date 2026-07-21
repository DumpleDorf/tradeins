import { prisma } from "@/lib/db";
import type { ZiplabsInconsistency } from "@/lib/ziplabs-sync-plan";

const LAST_SYNC_KEY = "ziplabs_last_sync_result";

export type ZiplabsLastSyncResult = {
  ranAt: string;
  fileName?: string;
  reportCount: number;
  created: string[];
  deleted: { rnNumber: string; make: string; model: string; year: number }[];
  createErrors: { rnNumber: string; error: string }[];
  inconsistencies: ZiplabsInconsistency[];
};

export async function saveZiplabsLastSync(result: ZiplabsLastSyncResult) {
  await prisma.systemSetting.upsert({
    where: { key: LAST_SYNC_KEY },
    create: { key: LAST_SYNC_KEY, value: JSON.stringify(result) },
    update: { value: JSON.stringify(result) },
  });
}

export async function getZiplabsLastSync(): Promise<ZiplabsLastSyncResult | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key: LAST_SYNC_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as ZiplabsLastSyncResult;
  } catch {
    return null;
  }
}
