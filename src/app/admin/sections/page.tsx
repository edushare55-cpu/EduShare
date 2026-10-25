import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import AdminSectionsManager from "@/components/admin/AdminSectionsManager";

export const dynamic = "force-dynamic";

export default async function AdminSectionsPage() {
  const session = await getAuthSession();
  if (!session || session.profile.role !== "ADMIN") redirect("/login");

  // Fetch all sections and faculty concurrently
  const [sections, faculty] = await Promise.all([
    prisma.class.findMany({
      include: {
        faculty: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "FACULTY" },
      select: { id: true, name: true, email: true, department: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Sections Management</h1>
          <p className="text-on-surface-variant text-lg">Create sections and assign them to faculty members.</p>
        </div>
      </div>

      <AdminSectionsManager initialSections={sections as any} facultyList={faculty as any} />
    </div>
  );
}
