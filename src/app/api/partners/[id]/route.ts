import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManagePartners } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canManagePartners(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const partner = await prisma.user.update({
    where: { id, role: "PARTNER" },
    data: {
      status: body.status,
      name: body.name,
      partnerProfile: body.companyName
        ? {
            update: {
              companyName: body.companyName,
              contactName: body.contactName,
              contactPhone: body.contactPhone,
            },
          }
        : undefined,
    },
    include: { partnerProfile: true },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: "PARTNER_UPDATED",
    entityType: "User",
    entityId: id,
    metadata: body,
  });

  return NextResponse.json(partner);
}
