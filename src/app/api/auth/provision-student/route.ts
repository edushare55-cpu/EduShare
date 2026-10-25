import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // ── Security gate ──────────────────────────────────────────────────────────
  const secret = request.headers.get("x-provision-secret");
  const expectedSecret = process.env.ADMIN_PROVISION_SECRET;

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { email: string; password: string; name: string; department: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, name, department } = body;

  const adminClient = createAdminClient();

  try {
    const { data: existingList } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingList?.users?.find((u) => u.email === email);

    let authUserId: string;

    if (existingAuthUser) {
      console.log(`[provision-student] Auth user already exists: ${email}`);
      const { data: updated, error: updateError } =
        await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
          password,
          user_metadata: { role: "STUDENT", name },
          email_confirm: true,
        });
      if (updateError) throw updateError;
      authUserId = updated.user.id;
    } else {
      const { data: created, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          user_metadata: { role: "STUDENT", name },
          email_confirm: true,
        });
      if (createError) throw createError;
      authUserId = created.user.id;
    }

    // First find the fake Prisma user by email
    const existingPrismaUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingPrismaUser && existingPrismaUser.id !== authUserId) {
      console.log(`[provision-student] Syncing Prisma seed record: ${existingPrismaUser.id} → ${authUserId}`);

      // Leverage Postgres ON UPDATE CASCADE to seamlessly update the PK and all related foreign keys
      await prisma.$executeRawUnsafe(
        `UPDATE "users" SET "id" = $1 WHERE "id" = $2`,
        authUserId,
        existingPrismaUser.id
      );
    }

    return NextResponse.json({
      success: true,
      message: `Student account ready. You can now log in with ${email}.`,
      userId: authUserId,
    });
  } catch (error: any) {
    console.error("[provision-student] Error:", error);
    return NextResponse.json({ error: error.message || "Provisioning failed" }, { status: 500 });
  }
}
