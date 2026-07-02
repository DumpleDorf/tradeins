import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canManageUsers } from "@/lib/rbac";
import { adminUserUpdateSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (parsed.data.status === "INACTIVE" && id === session.user.id) {
    return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
  }

  if (parsed.data.email && parsed.data.email.toLowerCase() !== existing.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const { password, ...userFields } = parsed.data;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userFields,
      ...(userFields.email ? { email: userFields.email.toLowerCase() } : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      partnerProfile: {
        select: { companyName: true },
      },
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: id,
    metadata: { ...parsed.data, password: password ? "[updated]" : undefined },
  });

  return NextResponse.json(user);
}
