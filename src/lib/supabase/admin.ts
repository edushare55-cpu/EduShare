/**
 * lib/supabase/admin.ts
 *
 * Supabase Admin client — uses the SERVICE ROLE key.
 * NEVER expose this to the browser. Only use in:
 *   - Server Actions
 *   - API Route Handlers (server-side only)
 *   - Server Components
 *
 * This client bypasses Row Level Security (RLS) and can perform
 * any operation on any table. Treat it like a superuser.
 */

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    error.name = "SUPABASE_SERVICE_ROLE_KEY_MISSING";
    throw error;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
