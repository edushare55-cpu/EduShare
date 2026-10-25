/**
 * app/api/analytics/route.ts
 *
 * GET /api/analytics — Admin only: Platform metrics and activity data
 * All queries run in parallel for maximum performance.
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // Run all DB queries in parallel
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalClasses,
      activeClasses,
      totalPosts,
      totalSubmissions,
      pendingReports,
      recentUsers,
      monthlyActivity,
      topClasses,
    ] = await Promise.all([
      // Total user count
      prisma.user.count(),

      // Students only
      prisma.user.count({ where: { role: "STUDENT" } }),

      // Faculty only
      prisma.user.count({ where: { role: "FACULTY" } }),

      // Total sections
      prisma.class.count(),

      // Active (non-archived) sections
      prisma.class.count({ where: { isArchived: false } }),

      // Total posts
      prisma.post.count(),

      // Total submissions
      prisma.submission.count(),

      // Pending reports requiring action
      prisma.report.count({ where: { status: "PENDING" } }),

      // 5 most recently registered users
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true, department: true },
      }),

      // Monthly activity: posts per day over the last 30 days
      prisma.$queryRaw<Array<{ date: string; post_count: number }>>`
        SELECT
          DATE("createdAt")::text as date,
          COUNT(*)::int as post_count
        FROM posts
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Top 5 most active classes by post count
      prisma.class.findMany({
        take: 5,
        include: {
          faculty: { select: { id: true, name: true } },
          _count:  { select: { posts: true, members: true } },
        },
        orderBy: {
          posts: { _count: "desc" },
        },
      }),
    ]);

    // Derived metric
    const submissionRate =
      totalPosts > 0 ? Math.round((totalSubmissions / totalPosts) * 100) : 0;

    return successResponse({
      overview: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalClasses,
        activeClasses,
        totalPosts,
        totalSubmissions,
        pendingReports,
        submissionRate,
      },
      recentUsers,
      monthlyActivity,
      topClasses,
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
