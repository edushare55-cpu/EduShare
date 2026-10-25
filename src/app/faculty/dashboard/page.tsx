import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import nextDynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardAnalytics = nextDynamic(
  () => import("@/components/faculty/DashboardAnalytics"),
  { 
    ssr: false, 
    loading: () => (
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6 animate-pulse">
        <Skeleton className="xl:col-span-2 h-[400px] rounded-3xl bg-surface-container-high/50" />
        <Skeleton className="h-[400px] rounded-3xl bg-surface-container-high/50" />
        <Skeleton className="xl:col-span-3 h-[450px] rounded-3xl bg-surface-container-high/50" />
      </div>
    )
  }
);

export const dynamic = "force-dynamic";

export default async function FacultyDashboardPage() {
  const session = await getAuthSession();
  if (!session || session.profile.role !== "FACULTY") redirect("/login");
  const facultyId = session.profile.id;

  // Fetch real data for faculty dashboard — wrapped in try/catch so a DB
  // hiccup (e.g. Supabase free-tier project paused) never crashes the page.
  let sections = 0;
  let totalStudents = 0;
  let activePosts = 0;
  let pendingSubmissions = 0;
  let submissionsStatus: { status: string; count: number }[] = [];
  let sectionsEngagement: { name: string; studentCount: number; postCount: number }[] = [];
  let recentActivity: { month: string; submissions: number }[] = [];
  let dbError = false;

  try {
    const [
      _sections,
      _totalStudents,
      _activePosts,
      _pendingSubmissions,
      _submissionsByStatus,
      _sectionsAnalytics,
      _recentSubs,
    ] = await Promise.all([
      // 1. Fetch faculty's sections count
      prisma.class.count({
        where: { facultyId, isArchived: false },
      }),
      // 2. Count distinct students across all their sections
      prisma.classMembership.count({
        where: { class: { facultyId } },
      }),
      // 3. Count total active posts in their sections
      prisma.post.count({
        where: { class: { facultyId } },
      }),
      // 4. Count pending submissions across their classes
      prisma.submission.count({
        where: {
          status: "SUBMITTED",
          post: { class: { facultyId } },
        },
      }),
      // 5. Submissions by status for Pie Chart
      prisma.submission.groupBy({
        by: ["status"],
        where: { post: { class: { facultyId } } },
        _count: { id: true },
      }),
      // 6. Sections engagement for Bar Chart
      prisma.class.findMany({
        where: { facultyId, isArchived: false },
        select: {
          name: true,
          _count: { select: { members: true, posts: true } },
        },
        take: 5,
      }),
      // 7. Recent submissions for Area Chart
      prisma.submission.findMany({
        where: { post: { class: { facultyId } } },
        select: { submittedAt: true },
        orderBy: { submittedAt: "desc" },
        take: 100,
      }),
    ]);

    sections = _sections;
    totalStudents = _totalStudents;
    activePosts = _activePosts;
    pendingSubmissions = _pendingSubmissions;

    // Format submissions by status
    submissionsStatus = _submissionsByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Format sections engagement
    sectionsEngagement = _sectionsAnalytics.map((s) => ({
      name: s.name.length > 15 ? s.name.substring(0, 15) + "..." : s.name,
      studentCount: s._count.members,
      postCount: s._count.posts,
    }));

    // Format recent activity (last 6 months)
    const monthsMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsMap.set(d.toLocaleString("default", { month: "short" }), 0);
    }
    _recentSubs.forEach((sub) => {
      const key = sub.submittedAt.toLocaleString("default", { month: "short" });
      if (monthsMap.has(key)) monthsMap.set(key, monthsMap.get(key)! + 1);
    });
    recentActivity = Array.from(monthsMap.entries()).map(([month, submissions]) => ({
      month,
      submissions,
    }));
  } catch (err) {
    console.error("[FacultyDashboard] Database unreachable:", err);
    dbError = true;
  }

  return (
    <>
      {/* DB connectivity warning — shown when Supabase is paused/unreachable */}
      {dbError && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-error/30 bg-error-container/20 px-5 py-4 text-on-error-container">
          <span className="material-symbols-outlined text-error text-[22px] shrink-0">cloud_off</span>
          <div>
            <p className="font-label-md font-bold text-error">Database temporarily unavailable</p>
            <p className="font-label-sm text-on-surface-variant mt-0.5">
              Could not connect to the database. Stats are showing as zero. Please refresh the page in a moment — if this persists, check your Supabase project is not paused.
            </p>
          </div>
        </div>
      )}

      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-secondary-container/20 border border-outline-variant/30 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary/20 blur-3xl rounded-full pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-0 right-40 -mb-20 w-64 h-64 bg-tertiary/20 blur-3xl rounded-full pointer-events-none mix-blend-multiply"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight mb-3">
            Welcome back, <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{session.profile.name}</span>
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl font-medium">
            Here's what's happening in your classes today. You have <strong className="text-primary">{pendingSubmissions}</strong> pending submissions to review.
          </p>
        </div>
      </div>

      {/* Premium Quick Stats Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="group bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Students</p>
              <h3 className="text-4xl font-black text-primary leading-none tracking-tight">{totalStudents.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="group bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-1">Active Posts</p>
              <h3 className="text-4xl font-black text-secondary leading-none tracking-tight">{activePosts.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className={`group bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default ${pendingSubmissions > 0 ? 'ring-2 ring-error/20' : ''}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 ${pendingSubmissions > 0 ? 'bg-error/5 group-hover:bg-error/10' : 'bg-tertiary/5 group-hover:bg-tertiary/10'} rounded-full blur-2xl transition-colors`}></div>
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${pendingSubmissions > 0 ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-1">Pending Reviews</p>
              <div className="flex items-end gap-3">
                <h3 className={`text-4xl font-black leading-none tracking-tight ${pendingSubmissions > 0 ? 'text-error' : 'text-tertiary'}`}>{pendingSubmissions.toLocaleString()}</h3>
                {pendingSubmissions > 0 && (
                  <span className="mb-1 px-2 py-0.5 rounded-full bg-error-container text-error text-xs font-bold animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Analytics Dashboard */}
      <DashboardAnalytics 
        submissionsStatus={submissionsStatus}
        sectionsEngagement={sectionsEngagement}
        recentActivity={recentActivity}
      />
    </>
  );
}
