"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchAdminNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  LoginFormValues,
  RegisterFormValues,
  ForgotPasswordFormValues,
} from "@/lib/validations/auth";

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export async function loginAction(data: LoginFormValues) {
  try {
    const supabase = createClient();
    const { email, password } = data;

    // 1. Authenticate with Supabase Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    if (!authData.user) {
      return { success: false as const, error: "Authentication failed." };
    }

    // 2. Fetch the authoritative role from Prisma (cannot be spoofed by client)
    const dbUser = await prisma.user.findUnique({
      where: { id: authData.user.id },
      select: { role: true, name: true, isActive: true, approvalStatus: true },
    });

    if (!dbUser) {
      // AUTO-PROVISIONING: If this is an admin account but the Prisma DB was wiped
      if (authData.user.email === "admin@edushare.edu" || authData.user.user_metadata?.role === "ADMIN") {
        
        // Clean up the dummy admin from seed.ts to avoid email unique constraints
        try {
          await prisma.user.delete({ where: { email: authData.user.email } });
        } catch (e) {
          // Ignore if it doesn't exist
        }

        const newAdmin = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            name: authData.user.user_metadata?.name || "System Administrator",
            department: "IT Department",
            role: "ADMIN",
            isActive: true,
          }
        });
        
        await supabase.auth.updateUser({
          data: { role: newAdmin.role, name: newAdmin.name },
        });

        return { success: true as const, role: newAdmin.role };
      }

      // Sign them back out — no profile means no access
      await supabase.auth.signOut();
      return {
        success: false as const,
        error:
          "No profile found for this account. Please contact your administrator.",
      };
    }

    if (!dbUser.isActive) {
      await supabase.auth.signOut();
      return {
        success: false as const,
        error: "Your account has been deactivated. Please contact an administrator.",
      };
    }

    if (dbUser.approvalStatus === "PENDING") {
      await supabase.auth.signOut();
      return {
        success: false as const,
        error: "Your registration is pending faculty approval.",
      };
    }

    if (dbUser.approvalStatus === "REJECTED") {
      await supabase.auth.signOut();
      return {
        success: false as const,
        error: "Your registration was rejected. Please contact the faculty.",
      };
    }

    // 3. Write the role into Supabase user_metadata
    await supabase.auth.updateUser({
      data: { role: dbUser.role, name: dbUser.name },
    });

    return { success: true as const, role: dbUser.role };
  } catch (err: any) {
    console.error("[loginAction] Unexpected error:", err);
    // If it's a Prisma connection error or similar, expose a generic but helpful message
    if (err?.message?.includes("Invalid `prisma.user.findUnique()` invocation") || err?.name === 'PrismaClientInitializationError') {
      return { success: false as const, error: "Database connection failed. Please check your Vercel Environment Variables (DATABASE_URL)." };
    }
    return { success: false as const, error: err.message || "An internal server error occurred." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export async function registerAction(data: RegisterFormValues) {
  try {
    const supabase = createClient();
    const { name, email, sectionCode, password } = data;

    // 1. Verify that the section code is valid
    const validClass = await prisma.class.findUnique({
      where: { classCode: sectionCode },
    });

    if (!validClass) {
      return {
        success: false as const,
        error: "Invalid Section Code. Please ask your faculty for the correct code.",
      };
    }

    // 2. Check if email already exists in Prisma
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false as const,
        error: "An account with this email already exists.",
      };
    }

    // 3. Create in Supabase Auth using Admin Client to auto-confirm email
    // (We don't want them waiting on an email, only Faculty Approval)
    const adminClient = createAdminClient();
    const { data: authData, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "STUDENT",
        name,
      },
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    if (!authData.user) {
      return { success: false as const, error: "Failed to create account." };
    }

    // 4. Create the Prisma user profile (PENDING) and link to the class
    try {
      await prisma.$transaction(async (tx) => {
        // Create User
        const newUser = await tx.user.create({
          data: {
            id: authData.user.id,
            name,
            email,
            role: "STUDENT",
            isActive: true, // They are technically active, just not approved
            approvalStatus: "PENDING",
          },
        });

        // Create ClassMembership
        await tx.classMembership.create({
          data: {
            classId: validClass.id,
            studentId: newUser.id,
          },
        });
      });

      // Notify admins that a new student registered
      await dispatchAdminNotification({
        type: "USER_REGISTERED",
        message: `A new student, ${name}, has registered and is pending approval.`,
        link: "/admin/users",
      });

      return { success: true as const };
    } catch (dbError: any) {
      console.error("[registerAction] DB Error:", dbError);

      // Rollback: delete the auth user we just created so we don't have orphans
      try {
        const rollbackAdminClient = createAdminClient();
        await rollbackAdminClient.auth.admin.deleteUser(authData.user.id);
      } catch (rollbackError) {
        console.error("[registerAction] Rollback failed:", rollbackError);
      }

      return {
        success: false as const,
        error: "Failed to create user profile. Please try again.",
      };
    }
  } catch (err: any) {
    console.error("[registerAction] Unexpected error:", err);
    if (err?.name === "SUPABASE_SERVICE_ROLE_KEY_MISSING" || err?.message?.includes("SUPABASE_SERVICE_ROLE_KEY") || err?.message?.includes("Missing")) {
      return { success: false as const, error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing." };
    }
    if (err?.name === "PrismaClientInitializationError" || err?.message?.includes("DATABASE_URL")) {
      return { success: false as const, error: "Database connection failed. Please contact the administrator." };
    }
    return { success: false as const, error: err.message || "An unexpected error occurred. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export async function forgotPasswordAction(data: ForgotPasswordFormValues) {
  const supabase = createClient();
  const { email } = data;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/update-password`,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}
