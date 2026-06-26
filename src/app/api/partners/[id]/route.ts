import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManagePartners } from "@/lib/rbac";
import { partnerUpdateSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canManagePartners(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = partnerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id, role: "PARTNER" },
    include: { partnerProfile: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  if (parsed.data.email && parsed.data.email.toLowerCase() !== existing.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const { companyName, contactName, contactPhone, password, ...userFields } = parsed.data;

  const partner = await prisma.user.update({
    where: { id, role: "PARTNER" },
    data: {
      ...userFields,
      ...(userFields.email ? { email: userFields.email.toLowerCase() } : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
      partnerProfile:
        companyName || contactName || contactPhone !== undefined
          ? {
              update: {
                ...(companyName ? { companyName } : {}),
                ...(contactName ? { contactName } : {}),
                ...(contactPhone !== undefined ? { contactPhone } : {}),
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
    metadata: { ...parsed.data, password: password ? "[updated]" : undefined },
  });

  return NextResponse.json(partner);
}
