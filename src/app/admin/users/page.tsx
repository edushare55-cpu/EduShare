import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic"; // Ensure fresh data on reload

export default async function AdminUsersPage() {
  const session = await getAuthSession();
  if (!session || session.profile.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id:         true,
      name:       true,
      email:      true,
      role:       true,
      department: true,
      isActive:   true,
      avatarUrl:  true,
      createdAt:  true,
      updatedAt:  true,
    },
  });

  // Convert dates to string so they can be passed as props if needed,
  // or we can map them to match the UserProfile type exactly.
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return <UsersClient initialUsers={serializedUsers as any} />;
}