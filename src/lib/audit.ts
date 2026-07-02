import { Prisma } from "@prisma/client";
import { prisma } from "./db";

type AuditParams = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}

/** Write audit log without blocking the API response. */
export function logAudit(params: AuditParams) {
  void createAuditLog(params).catch((err) => console.error("[audit]", err));
}
