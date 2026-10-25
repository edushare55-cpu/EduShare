import React from "react";
import StatCard from "@/components/shared/StatCard";
import StudentAnalytics from "@/components/student/StudentAnalytics";
import RecentFeedPreview from "@/components/student/RecentFeedPreview";
import { getAuthSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getAuthSession();
  if (!session || session.profile.role !== "STUDENT") {
    redirect("/login");
  }

  const studentId = session.profile.id;

  // 1. Unified Backend Aggregation via Promise.all
  const [
    activeClassesCount,
    pendingTasksCount,
    missedTasksCount,
    completedTasksCount,
    upcomingDeadlines,
    recentActivity,
    analyticsPosts
  ] = await Promise.all([
    // a) Active Classes Count
    prisma.classMembership.count({
      where: { studentId }
    }),

    // b) Pending Tasks Count (Future deadline or no deadline)
    prisma.post.count({
      where: {
        isSubmissionPost: true,
        class: { members: { some: { studentId } } },
        submissions: { none: { studentId } },
        OR: [
          { submissionDeadline: { gte: new Date() } },
          { submissionDeadline: null }
        ]
      }
    }),

    // b2) Missed Tasks Count (Past deadline)
    prisma.post.count({
      where: {
        isSubmissionPost: true,
        class: { members: { some: { studentId } } },
        submissions: { none: { studentId } },
        submissionDeadline: { lt: new Date() }
      }
    }),

    // c) Completed Tasks (Recent Grades) Count
    prisma.submission.count({
      where: {
        studentId,
        status: "REVIEWED"
      }
    }),

    // d) Upcoming Deadlines (next 5 pending assignments)
    prisma.post.findMany({
      where: {
        isSubmissionPost: true,
        class: { members: { some: { studentId } } },
        submissions: { none: { studentId } },
        submissionDeadline: { gte: new Date() }
      },
      orderBy: { submissionDeadline: "asc" },
      take: 5,
      include: { class: { select: { id: true, name: true, classCode: true } } }
    }),

    // e) Recent Activity (latest 5 standard announcements)
    prisma.post.findMany({
      where: {
        isSubmissionPost: false,
        author: { is: { role: "FACULTY" } },
        class: { members: { some: { studentId } } }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        class: { select: { id: true, name: true, classCode: true } },
        author: { select: { id: true, name: true, role: true } },
        _count: { select: { files: true, comments: true } }
      }
    }),

    // f) Minimal posts for StudentAnalytics hydration
    prisma.post.findMany({
      where: { class: { members: { some: { studentId } } } },
      select: { 
        id: true,
        createdAt: true, 
        isSubmissionPost: true, 
        submissionDeadline: true,
        _count: { select: { files: true } } 
      }
    })
  ]);

  // For StudentAnalytics, it expects `files: []` instead of `_count: { files }` in its calculation
  // Let's format the posts for the Recharts client component
  const formattedAnalyticsPosts = analyticsPosts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    submissionDeadline: p.submissionDeadline?.toISOString() || null,
    files: Array.from({ length: p._count.files }) // Fake array length to satisfy `files.length > 0` checks
  }));

  return (
    <>
      <div className="hidden md:flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary tracking-tight">
            Welcome back, {session.profile.name?.split(" ")[0] || "Student"}!
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Here&apos;s your current overview and recent class activity.
          </p>
        </div>
      </div>

      {/* Graceful Empty State */}
      {activeClassesCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm text-center">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[40px]">school</span>
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-3">Welcome to your Dashboard!</h3>
          <p className="text-on-surface-variant max-w-md text-lg mb-8">
            You aren&apos;t enrolled in any classes yet. Join your first class to see your stats, assignments, and activity!
          </p>
          <Link
            href="/student/classes"
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            Find a Class
          </Link>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Active Classes"
              value={activeClassesCount.toString()}
              icon="school"
              iconBg="bg-primary-fixed"
              iconColor="text-on-primary-fixed"
            />
            <StatCard
              label="Pending Tasks"
              value={pendingTasksCount.toString()}
              icon="pending_actions"
              iconBg="bg-tertiary-fixed"
              iconColor="text-on-tertiary-fixed"
              isAlert={pendingTasksCount > 0}
              alertLabel={pendingTasksCount > 0 ? "To Do" : undefined}
            />
            <StatCard
              label="Missed Tasks"
              value={missedTasksCount.toString()}
              icon="assignment_late"
              iconBg="bg-error/10"
              iconColor="text-error"
              isAlert={missedTasksCount > 0}
              alertLabel={missedTasksCount > 0 ? "Overdue" : undefined}
            />
            <StatCard
              label="Completed Tasks"
              value={completedTasksCount.toString()}
              icon="task_alt"
              iconBg="bg-secondary-fixed"
              iconColor="text-on-secondary-fixed"
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <RecentFeedPreview posts={recentActivity as any} />
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                <h3 className="font-headline-md text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">calendar_clock</span>
                  Upcoming Deadlines
                </h3>
                {upcomingDeadlines.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {upcomingDeadlines.map((post) => (
                      <Link
                        key={post.id}
                        href={`/student/classes/${post.classId}/assignments`}
                        className="flex flex-col gap-1 p-3 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-label-md text-on-surface truncate group-hover:text-primary transition-colors">
                            {post.class.name}
                          </span>
                          <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0">
                            Assignment
                          </span>
                        </div>
                        <p className="font-label-sm text-tertiary font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          Due {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(post.submissionDeadline!))}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-on-surface-variant font-body-md bg-surface-container-low/50 rounded-lg border border-outline-variant/30">
                    No upcoming deadlines!
                  </div>
                )}
              </div>
            </div>
          </div>

          <section>
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-6">
              Activity Overview
            </h3>
            {/* Cast as any due to the mapped fake files array for the client component */}
            <StudentAnalytics posts={formattedAnalyticsPosts as any} />
          </section>
        </>
      )}
    </>
  );
}
