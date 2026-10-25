/**
 * src/middleware.ts
 *
 * Next.js Middleware — runs on every matching request BEFORE the page renders.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session (keeps auth cookies fresh)
 *  2. Protect role-based routes — redirect unauthenticated users to /login
 *  3. Redirect authenticated users away from auth pages to their portal
 *  4. Enforce role-based access — prevent cross-portal navigation
 *
 * Role → Portal mapping:
 *   STUDENT  → /student/dashboard
 *   FACULTY  → /faculty/dashboard
 *   ADMIN    → /admin/dashboard
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ["/student", "/faculty", "/admin"];

// Routes that should only be accessible when NOT logged in
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/update-password"];

// Internal API routes — always allow, never redirect
const BYPASS_PREFIXES = ["/api/", "/_next/", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 0. Skip middleware for internal/static routes ─────────────────────────
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 0b. Guard: skip if Supabase not yet configured ────────────────────────
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  // ── 1. Refresh session & get authenticated user ───────────────────────────
  const { supabaseResponse, user } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // ── 2. Unauthenticated user hits a protected route → send to /login ───────
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // Role is stored in user_metadata after first login via loginAction.
    // On very first login this will be undefined — loginAction handles the
    // DB lookup and sets it, then the page-level redirect takes over.
    const role = user.user_metadata?.role as string | undefined;

    // ── 3. Authenticated user hits an auth page → redirect to their portal ──
    if (isAuthRoute) {
      if (role) {
        return NextResponse.redirect(new URL(getRoleHome(role), request.url));
      }
      // No role in metadata yet (just provisioned) → allow through to login
      // so the loginAction can complete the metadata sync
      return supabaseResponse;
    }

    // ── 4. Role-based portal enforcement ─────────────────────────────────────
    // Only enforce if we know the role. If metadata is missing (edge case after
    // a fresh provision), allow through — loginAction will sync on the next login.
    if (isProtected && role) {
      const allowedPrefix = getRolePrefix(role);
      if (!pathname.startsWith(allowedPrefix)) {
        // Wrong portal — redirect to their correct home
        return NextResponse.redirect(
          new URL(getRoleHome(role), request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRolePrefix(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "FACULTY":
      return "/faculty";
    case "STUDENT":
    default:
      return "/student";
  }
}

function getRoleHome(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "FACULTY":
      return "/faculty/dashboard";
    case "STUDENT":
    default:
      return "/student/dashboard";
  }
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// Run middleware on all routes except Next.js internals & static assets

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
