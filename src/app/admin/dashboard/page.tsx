import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import StatCard from "@/components/admin/StatCard";
import AdminDashboardAnalytics from "@/components/admin/AdminDashboardAnalytics";
import RecentActivity from "@/components/admin/RecentActivity";

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  if (!session || session.profile.role !== "ADMIN") redirect("/login");

  // Fetch all analytics in parallel — no API round-trip
  const [
    totalUsers,
    totalStudents,
    totalFaculty,
    activeClasses,
    totalPosts,
    pendingReports,
    recentUsers,
    monthlyActivity,
    reportAgg,
    userAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.class.count({ where: { isArchived: false } }),
    prisma.post.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id:         true,
        name:       true,
        email:      true,
        role:       true,
        createdAt:  true,
        department: true,
      },
    }),
    prisma.$queryRaw<{ date: string; post_count: number }[]>`
      SELECT DATE("createdAt")::text as date, COUNT(*)::int as post_count
      FROM posts
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.report.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    })
  ]);

  const reportHealth = reportAgg.map(r => ({ status: r.status, count: r._count.id }));
  const userDemographics = userAgg.map(u => ({ role: u.role, count: u._count.id }));

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Dashboard Overview
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Real-time metrics and platform health for EduShare.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/admin/users"
            className="bg-secondary text-on-secondary px-5 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity card-shadow-1"
          >
            Manage Users
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          icon="group"
          iconBg="bg-primary-fixed"
          iconColor="text-primary"
          badge={{ label: `${totalStudents} students`, type: "success" }}
        />
        <StatCard
          label="Active Sections"
          value={activeClasses.toLocaleString()}
          icon="class"
          iconBg="bg-secondary-fixed"
          iconColor="text-secondary"
          badge={{ label: `${totalFaculty} faculty`, type: "success" }}
        />
        <StatCard
          label="Pending Reports"
          value={pendingReports.toLocaleString()}
          icon="report"
          iconBg="bg-error-container"
          iconColor="text-error"
          badge={
            pendingReports > 0
              ? { label: "Requires Action", type: "error" }
              : undefined
          }
          isAlert={pendingReports > 0}
        />
        <StatCard
          label="Total Posts"
          value={totalPosts.toLocaleString()}
          icon="library_books"
          iconBg="bg-tertiary-fixed"
          iconColor="text-tertiary"
          badge={{ label: "All time", type: "success" }}
        />
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <AdminDashboardAnalytics 
            monthlyActivity={monthlyActivity} 
            userDemographics={userDemographics} 
            reportHealth={reportHealth} 
          />
        </div>
        <div className="xl:col-span-1 mt-0 xl:mt-8">
          <RecentActivity users={recentUsers} />
        </div>
      </div>
    </>
  );
}
