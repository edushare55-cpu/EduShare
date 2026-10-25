import React from "react";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import FacultyProfileClient from "./profile-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Profile" };

export default async function FacultyProfilePage() {
  const session = await getAuthSession();

  if (!session || session.profile.role !== "FACULTY") {
    redirect("/login");
  }

  const facultyId = session.profile.id;

  // 1. Fetch the latest user profile directly from DB to ensure data is fresh
  const user = await prisma.user.findUnique({
    where: { id: facultyId },
  });

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch specific stats for the faculty profile
  const [activeClassesCount, totalStudentsCount] = await Promise.all([
    // Active classes taught by this faculty (not archived)
    prisma.class.count({
      where: { 
        facultyId,
        isArchived: false,
      },
    }),
    // Total students enrolled in all of their non-archived classes
    prisma.classMembership.count({
      where: {
        class: {
          facultyId,
          isArchived: false,
        },
      },
    }),
  ]);

  return (
    <FacultyProfileClient 
      user={user} 
      stats={{
        activeClasses: activeClassesCount,
        totalStudents: totalStudentsCount,
      }} 
    />
  );
}
