import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/provision-admin
 *
 * One-time route to create the admin account in Supabase Auth and sync it
 * with the Prisma `users` table.
 *
 * Protected by a secret token passed in the X-Provision-Secret header.
 * Run once, then the admin can log in normally.
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   name: string
 * }
 */
export async function POST(request: NextRequest) {
  // ── Security gate ──────────────────────────────────────────────────────────
  const secret = request.headers.get("x-provision-secret");
  const expectedSecret = process.env.ADMIN_PROVISION_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Server not configured for provisioning. Set ADMIN_PROVISION_SECRET in .env.local." },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { email: string; password: string; name: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, name } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "email, password, and name are required" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  try {
    // ── Step 1: Check if auth user already exists ──────────────────────────
    const { data: existingList } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingList?.users?.find((u) => u.email === email);

    let authUserId: string;

    if (existingAuthUser) {
      // User exists in Auth — update metadata and password
      console.log(`[provision-admin] Auth user already exists: ${email}`);

      const { data: updated, error: updateError } =
        await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
          password,
          user_metadata: { role: "ADMIN", name },
          email_confirm: true,
        });

      if (updateError) throw updateError;
      authUserId = updated.user.id;
    } else {
      // ── Step 2: Create user in Supabase Auth ────────────────────────────
      const { data: created, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          user_metadata: { role: "ADMIN", name },
          email_confirm: true, // skip email verification for admin
        });

      if (createError) throw createError;
      authUserId = created.user.id;
      console.log(`[provision-admin] Created Auth user: ${authUserId}`);
    }

    // ── Step 3: Upsert Prisma user record with real Supabase UUID ──────────
    // First, delete any existing Prisma user with the same email (old seed record)
    const existingPrismaUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingPrismaUser && existingPrismaUser.id !== authUserId) {
      // Old seeded user with fake UUID — delete it and recreate with real UUID
      console.log(
        `[provision-admin] Replacing Prisma seed record: ${existingPrismaUser.id} → ${authUserId}`
      );

      // Cascade: delete related records owned by this fake user ID
      await prisma.notification.deleteMany({ where: { userId: existingPrismaUser.id } });
      await prisma.report.deleteMany({ where: { reporterId: existingPrismaUser.id } });
      await prisma.user.delete({ where: { id: existingPrismaUser.id } });
    }

    // Upsert the user with the correct Supabase Auth UUID
    const prismaUser = await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        name,
        email,
        role: "ADMIN",
        isActive: true,
        department: "IT Department",
      },
      create: {
        id: authUserId,
        name,
        email,
        role: "ADMIN",
        isActive: true,
        department: "IT Department",
      },
    });

    console.log(`[provision-admin] ✅ Prisma user synced: ${prismaUser.id}`);

    return NextResponse.json({
      success: true,
      message: `Admin account ready. You can now log in with ${email}.`,
      userId: authUserId,
    });
  } catch (error: any) {
    console.error("[provision-admin] Error:", error);
    return NextResponse.json(
      { error: error.message || "Provisioning failed" },
      { status: 500 }
    );
  }
}
