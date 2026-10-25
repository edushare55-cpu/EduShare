/**
 * app/page.tsx — Root Landing Page
 *
 * Redirects authenticated users to their role-based dashboard.
 * Unauthenticated users see the landing page (or are redirected to /login).
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  // Guard: only call Supabase if env vars are configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect authenticated users to their dashboard
    if (user) {
      const role = user.user_metadata?.role as string | undefined;
      switch (role) {
        case "ADMIN":
          redirect("/admin/dashboard");
        case "FACULTY":
          redirect("/faculty/dashboard");
        default:
          redirect("/student/dashboard");
      }
    }
  }

  // Landing page for unauthenticated visitors
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="text-center max-w-2xl">
        <Image
          src="/pclu-logo.png"
          alt="Polytechnic College of La Union seal"
          width={96}
          height={104}
          className="mx-auto mb-6 h-24 w-auto object-contain drop-shadow-md"
          priority
        />
        <h1 className="text-5xl font-bold text-gray-900 mb-4">EduShare</h1>
        <p className="text-xl text-gray-600 mb-8">
          A collaborative learning resource exchange platform for polytechnic college students and faculty.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
