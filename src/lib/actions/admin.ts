"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { Role } from "@prisma/client";
import { AdminCreateUserFormValues } from "@/lib/validations/auth";

export async function adminCreateUserAction(data: AdminCreateUserFormValues) {
  try {
    const session = await getAuthSession();
    
    // 1. Security Check: Only ADMINs can perform this action
    if (!session || session.profile.role !== "ADMIN") {
      return { success: false as const, error: "Unauthorized access. Only administrators can perform this action." };
    }

    const { name, email, department, role, password } = data;

    // 2. Check if email already exists in Prisma
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false as const,
        error: "An account with this email already exists.",
      };
    }

    const adminClient = createAdminClient();

    // 3. Create user in Supabase Auth using Admin API
    // email_confirm: true ensures the user does not need to verify their email
    const { data: authData, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        name,
      },
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    if (!authData.user) {
      return { success: false as const, error: "Failed to create account in identity provider." };
    }

    // 4. Create the user in Prisma
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          name,
          email,
          department: department || "N/A",
          role: role as Role,
          isActive: true,
          approvalStatus: "APPROVED",
        },
      });

      return { success: true as const };
    } catch (dbError: any) {
      console.error("[adminCreateUserAction] DB Error:", dbError);

      // Rollback: delete the auth user
      try {
        await adminClient.auth.admin.deleteUser(authData.user.id);
      } catch (rollbackError) {
        console.error("[adminCreateUserAction] Rollback failed:", rollbackError);
      }

      return {
        success: false as const,
        error: "Failed to sync user profile. Please try again.",
      };
    }
  } catch (err: any) {
    console.error("[adminCreateUserAction] Unexpected error:", err);
    if (err?.name === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      return { success: false as const, error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing." };
    }
    return { success: false as const, error: "An internal server error occurred." };
  }
}
