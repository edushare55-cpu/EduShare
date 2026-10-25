import React from "react";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PublicProfileClient from "@/components/profile/public-profile-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile Overview" };

export default async function StudentViewUserProfilePage({ params }: { params: { id: string } }) {
  const session = await getAuthSession();

  if (!session || session.profile.role !== "STUDENT") {
    redirect("/login");
  }

  // If the user is trying to view their own profile, redirect to their private settings hub
  if (session.profile.id === params.id) {
    redirect("/student/profile");
  }

  const userToView = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!userToView) {
    redirect("/student/dashboard"); // Or a 404 page
  }

  return <PublicProfileClient user={userToView} />;
}
