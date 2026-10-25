import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { 
  title: "My Profile & Settings - EduShare",
  description: "Manage your student profile and account settings" 
};

export default async function StudentProfilePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  // Ensure only students can access this route
  if (session.profile.role !== "STUDENT") {
    redirect("/unauthorized");
  }

  // Fetch actual data for the Overview tab
  const enrolledClassesCount = await prisma.classMembership.count({
    where: { studentId: session.profile.id },
  });

  const totalSubmissionsCount = await prisma.submission.count({
    where: { studentId: session.profile.id },
  });

  return (
    <ProfileClient 
      user={session.profile} 
      stats={{
        enrolledClasses: enrolledClassesCount,
        totalSubmissions: totalSubmissionsCount,
      }}
    />
  );
}
