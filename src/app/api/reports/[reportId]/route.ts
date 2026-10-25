/**
 * app/api/reports/[reportId]/route.ts
 *
 * GET   /api/reports/[reportId]  — Admin: Get report details
 * PATCH /api/reports/[reportId]  — Admin: Resolve or dismiss a report
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { resolveReportSchema } from "@/lib/validations/post";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── GET /api/reports/[reportId] ──────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);
    if (session.profile.role !== "ADMIN") return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const report = await prisma.report.findUnique({
      where: { id: params.reportId },
      include: {
        reporter:     { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        reportedUser: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        post: {
          select: {
            id: true, content: true, createdAt: true,
            class:  { select: { id: true, name: true } },
            author: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!report) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    return successResponse(report);
  } catch (error) {
    console.error("[GET /api/reports/[reportId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/reports/[reportId] ────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);
    if (session.profile.role !== "ADMIN") return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const report = await prisma.report.findUnique({
      where: { id: params.reportId },
    });
    if (!report) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    if (report.status !== "PENDING") {
      return errorResponse("This report has already been actioned.", 400);
    }

    const body = await request.json();
    const parsed = resolveReportSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { status, actionTaken } = parsed.data;
    const now = new Date();

    if (status === "RESOLVED") {
      // Update report to resolved
      const updatedReport = await prisma.report.update({
        where: { id: params.reportId },
        data: { status: "RESOLVED", actionTaken: actionTaken ?? null, resolvedAt: now },
      });

      // Action: Remove reported post if specified
      if (actionTaken?.includes("remove_post") && report.postId) {
        try {
          await prisma.post.delete({ where: { id: report.postId } });
        } catch {
          console.warn("[PATCH /api/reports] Post removal failed — may already be deleted.");
        }
      }

      // Action: Suspend reported user if specified
      if (actionTaken?.includes("suspend_user") && report.reportedUserId) {
        try {
          await prisma.user.update({
            where: { id: report.reportedUserId },
            data: { isActive: false },
          });

          // Also ban the Supabase Auth account
          const adminClient = createAdminClient();
          await adminClient.auth.admin.updateUserById(report.reportedUserId, {
            ban_duration: "87600h", // ~10 years = effectively permanent
          });
        } catch (suspendError) {
          console.warn("[PATCH /api/reports] User suspension failed:", suspendError);
        }
      }

      // Notify the reporter
      try {
        await createNotification({
          userId:      report.reporterId,
          type:        "REPORT_RESOLVED",
          message:     "Your report has been reviewed and resolved.",
          referenceId: report.id,
        });
      } catch (notifError) {
        console.warn("[PATCH /api/reports] Reporter notification failed:", notifError);
      }

      return successResponse(updatedReport, "Report resolved.");
    } else {
      // Dismissed
      const updatedReport = await prisma.report.update({
        where: { id: params.reportId },
        data: { status: "DISMISSED", resolvedAt: now },
      });

      return successResponse(updatedReport, "Report dismissed.");
    }
  } catch (error) {
    console.error("[PATCH /api/reports/[reportId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
