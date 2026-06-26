import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManagePartners } from "@/lib/rbac";
import { partnerInviteSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManagePartners(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partners = await prisma.user.findMany({
    where: { role: UserRole.PARTNER },
    include: { partnerProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManagePartners(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = partnerInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const partner = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
        passwordHash,
        role: UserRole.PARTNER,
        status: "ACTIVE",
        partnerProfile: {
          create: {
            companyName: parsed.data.companyName,
            contactName: parsed.data.contactName,
            contactPhone: parsed.data.contactPhone,
          },
        },
      },
      include: { partnerProfile: true },
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "PARTNER_INVITED",
      entityType: "User",
      entityId: partner.id,
    });

    return NextResponse.json(partner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
  }
}
