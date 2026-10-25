/**
 * app/api/profile/password/route.ts
 *
 * PATCH /api/profile/password — Update own password
 * Verifies current password before allowing change.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
      .regex(/[0-9]/, "New password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { currentPassword, newPassword } = parsed.data;

    const supabase = createClient();

    // Verify current password by attempting sign-in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email:    profile.email,
      password: currentPassword,
    });

    if (verifyError) {
      return errorResponse("Current password is incorrect.", 400);
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[PATCH /api/profile/password] Update failed:", updateError);
      return errorResponse("Failed to update password. Please try again.", 500);
    }

    return successResponse(null, "Password updated successfully.");
  } catch (error) {
    console.error("[PATCH /api/profile/password]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
