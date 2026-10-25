import React from "react";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import { getAuthSession } from "@/lib/auth-session";
import { AuthInitializer } from "@/components/shared/auth-initializer";
import { redirect } from "next/navigation";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  
  if (!session || session.profile.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <AuthInitializer user={session.profile} />
      <StudentSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-clip">
        <StudentHeader />
        <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full flex-1 flex flex-col gap-8">
          {children}
        </div>
      </main>
    </div>
  );
}
