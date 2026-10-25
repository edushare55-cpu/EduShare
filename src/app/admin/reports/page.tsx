import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getAuthSession();
  if (!session || session.profile.role !== "ADMIN") redirect("/login");

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      reportedUser: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      post: {
        select: {
          id: true,
          content: true,
          class: { select: { id: true, name: true } },
          author: { select: { id: true, name: true } },
        },
      },
    },
  });

  const serializedReports = reports.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() || null,
  }));

  return <ReportsClient initialReports={serializedReports as any} />;
}