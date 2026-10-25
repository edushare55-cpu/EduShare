/**
 * lib/auth-session.ts
 *
 * Reusable session resolver for API route handlers.
 * Fetches both the Supabase Auth user and their Prisma profile in one call.
 * Returns null for unauthenticated or deactivated users.
 */

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import type { User, Role } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthSession = {
  supabaseUser: { id: string; email: string };
  profile: User;
};

// ─── Session Resolver ─────────────────────────────────────────────────────────

/**
 * Resolves the current authenticated session.
 * Returns null if:
 *  - No valid Supabase session exists
 *  - No matching Prisma profile exists
 *  - The user account is deactivated (isActive = false)
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!profile || !profile.isActive) return null;

    return {
      supabaseUser: { id: user.id, email: user.email! },
      profile,
    };
  } catch {
    return null;
  }
}

// ─── Role Guard Helper ────────────────────────────────────────────────────────

/**
 * Checks if a user's role is one of the allowed roles.
 * @param profile - Prisma User profile
 * @param roles - Array of allowed roles
 */
export function requireRole(profile: User, roles: Role[]): boolean {
  return roles.includes(profile.role);
}
