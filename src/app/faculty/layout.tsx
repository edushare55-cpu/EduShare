import React from "react";
import FacultySidebar from "@/components/faculty/FacultySidebar";
import FacultyHeader from "@/components/faculty/FacultyHeader";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AuthInitializer } from "@/components/shared/auth-initializer";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session || session.profile.role !== "FACULTY") {
    redirect("/login");
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <AuthInitializer user={session.profile} />
      <FacultySidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-clip">
        <FacultyHeader />
        <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full flex-1 flex flex-col gap-8">
          {children}
        </div>
      </main>
    </div>
  );
}
