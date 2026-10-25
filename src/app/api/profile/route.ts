/**
 * app/api/profile/route.ts
 *
 * GET   /api/profile  — Get own profile
 * PATCH /api/profile  — Update own profile (name, department, avatarUrl)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  department: z.string().max(100).optional(),
  avatarUrl:  z.string().url("Invalid avatar URL").optional(),
});

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    // Return profile without exposing sensitive internal fields unnecessarily
    return successResponse({
      id:         profile.id,
      email:      profile.email,
      name:       profile.name,
      avatarUrl:  profile.avatarUrl,
      department: profile.department,
      role:       profile.role,
      isActive:   profile.isActive,
      createdAt:  profile.createdAt,
      updatedAt:  profile.updatedAt,
    });
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return errorResponse("No fields provided to update.", 400);
    }

    // Update Prisma profile
    const updatedProfile = await prisma.user.update({
      where: { id: profile.id },
      data: updates,
      select: {
        id:         true,
        email:      true,
        name:       true,
        avatarUrl:  true,
        department: true,
        role:       true,
        isActive:   true,
        createdAt:  true,
        updatedAt:  true,
      },
    });

    // Sync name to Supabase Auth metadata if changed
    if (updates.name) {
      try {
        const supabase = createClient();
        await supabase.auth.updateUser({ data: { name: updates.name } });
      } catch (metaError) {
        console.warn("[PATCH /api/profile] Supabase metadata sync failed:", metaError);
      }
    }

    return successResponse(updatedProfile, "Profile updated successfully.");
  } catch (error) {
    console.error("[PATCH /api/profile]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
