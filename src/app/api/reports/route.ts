/**
 * app/api/reports/route.ts
 *
 * GET  /api/reports  — Admin only: Fetch all reports (with optional status filter)
 * POST /api/reports  — Student or Faculty: File a content report
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createReportSchema } from "@/lib/validations/post";
import { dispatchAdminNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── GET /api/reports ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    if (profile.role !== "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const statusParam = request.nextUrl.searchParams.get("status");
    const validStatuses = ["PENDING", "RESOLVED", "DISMISSED"] as const;
    const statusFilter = validStatuses.includes(statusParam as (typeof validStatuses)[number])
      ? (statusParam as (typeof validStatuses)[number])
      : undefined;

    const reports = await prisma.report.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: {
        reporter:     { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        reportedUser: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            class:  { select: { id: true, name: true } },
            author: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [
        { status: "asc" },     // PENDING first (alphabetically P < R < D)
        { createdAt: "desc" },
      ],
    });

    return successResponse({ reports, total: reports.length });
  } catch (error) {
    console.error("[GET /api/reports]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/reports ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    // Only Students and Faculty can file reports
    if (profile.role === "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { postId, reportedUserId, reason, description } = parsed.data;

    // Validate targets exist
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
      if (!post) return errorResponse("The reported post was not found.", 404);
    }

    if (reportedUserId) {
      if (reportedUserId === profile.id) {
        return errorResponse("You cannot report yourself.", 400);
      }
      const user = await prisma.user.findUnique({ where: { id: reportedUserId }, select: { id: true } });
      if (!user) return errorResponse("The reported user was not found.", 404);
    }

    const report = await prisma.report.create({
      data: {
        reporterId:     profile.id,
        postId:         postId ?? null,
        reportedUserId: reportedUserId ?? null,
        reason,
        description:    description ?? null,
        status:         "PENDING",
      },
      include: {
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
    });

    // Fire-and-forget admin notification
    await dispatchAdminNotification({
      type: "NEW_REPORT",
      message: `A new report has been filed by ${profile.name}. Reason: ${reason}.`,
      link: "/admin/reports",
      referenceId: report.id,
    });

    return successResponse(report, "Report submitted successfully.", 201);
  } catch (error) {
    console.error("[POST /api/reports]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
