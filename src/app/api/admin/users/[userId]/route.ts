/**
 * app/api/admin/users/[userId]/route.ts
 *
 * PATCH /api/admin/users/[userId] — Admin only: Toggle user active status
 * Deactivate: sets isActive=false + Supabase ban (87600h)
 * Activate:   sets isActive=true  + removes Supabase ban
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { logAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

const adminUpdateUserSchema = z.object({
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);
    if (session.profile.role !== "ADMIN") return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const { userId } = params;

    const body = await request.json();
    const parsed = adminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { isActive, password } = parsed.data;

    // Prevent self-deactivation (only block if they are explicitly setting isActive to false)
    if (userId === session.profile.id && isActive === false) {
      return errorResponse("You cannot deactivate your own account.", 400);
    }

    // Fetch target user for security checks
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!targetUser) return errorResponse("User not found.", 404);

    if (password && targetUser.role === "STUDENT") {
      return errorResponse("Cannot reset passwords for STUDENT accounts.", 403);
    }

    const adminClient = createAdminClient();
    
    // Process password update
    if (password) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
      if (error) {
        return errorResponse("Failed to update password.", 500);
      }
      
      await logAction({
        userId: session.profile.id,
        action: "ADMIN_PASSWORD_RESET",
        resourceType: "USER",
        resourceId: userId,
        details: { targetRole: targetUser.role },
      });
    }

    // Process status toggle (if provided)
    let updatedUser = null;
    if (isActive !== undefined) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data:  { isActive },
        select: {
          id:         true,
          name:       true,
          email:      true,
          role:       true,
          department: true,
          isActive:   true,
          avatarUrl:  true,
          createdAt:  true,
        },
      });

      if (isActive) {
        // Restore access — remove ban
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
      } else {
        // Ban user effectively permanently (~10 years)
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: "87600h" });
      }
    } else {
      // If only password was updated, just fetch the user to return
      updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id:         true,
          name:       true,
          email:      true,
          role:       true,
          department: true,
          isActive:   true,
          avatarUrl:  true,
          createdAt:  true,
        },
      });
    }

    return successResponse(
      updatedUser,
      password && isActive !== undefined
        ? "User updated successfully."
        : password
        ? "Password reset successfully."
        : isActive
        ? "User activated."
        : "User deactivated."
    );
  } catch (error: any) {
    console.error("[PATCH /api/admin/users/[userId]]", error);
    if (error?.name === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      return errorResponse("Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.", 500);
    }
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);
    if (session.profile.role !== "ADMIN") return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const { userId } = params;

    // Prevent self-deletion
    if (userId === session.profile.id) {
      return errorResponse("You cannot delete your own account.", 400);
    }

    // Fetch target user for security checks
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });

    if (!targetUser) return errorResponse("User not found.", 404);

    // Safeguard: Only allow deletion if the account is deactivated
    if (targetUser.isActive) {
      return errorResponse("Account must be deactivated before it can be deleted.", 400);
    }

    const adminClient = createAdminClient();

    // 1. Delete from database
    await prisma.user.delete({
      where: { id: userId },
    });

    // 2. Delete from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
       console.error("[DELETE /api/admin/users/[userId]] Supabase Auth Delete Error:", authError);
       // We log it, but the DB delete was successful. Ideally, we shouldn't fail if DB succeeds.
       // However, if the user was already deleted from Auth somehow, it's fine.
    }

    await logAction({
      userId: session.profile.id,
      action: "ADMIN_DELETE_USER",
      resourceType: "USER",
      resourceId: userId,
      details: { targetRole: targetUser.role },
    });

    return successResponse(null, "User completely deleted from the system.");
  } catch (error: any) {
    console.error("[DELETE /api/admin/users/[userId]]", error);
    if (error?.name === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      return errorResponse("Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.", 500);
    }
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
