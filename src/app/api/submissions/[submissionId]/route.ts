/**
 * app/api/submissions/[submissionId]/route.ts
 *
 * PATCH /api/submissions/[submissionId]
 * — Faculty only: Score a student submission and save feedback
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

const reviewSubmissionSchema = z.object({
  status:   z.enum(["REVIEWED"]),
  score:    z.number().finite().min(0).max(100).optional(),
  feedback: z.string().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { submissionId } = params;

    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        post: {
          include: {
            class: { select: { facultyId: true, name: true } },
          },
        },
      },
    });

    if (!submission) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Verify faculty owns the class this submission belongs to
    if (submission.post.class.facultyId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = reviewSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "REVIEWED",
        ...(parsed.data.score !== undefined ? { score: parsed.data.score } : {}),
        ...(parsed.data.feedback !== undefined ? { feedback: parsed.data.feedback || null } : {}),
      },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Notify the student
    try {
      const preview =
        submission.post.content.length > 50
          ? submission.post.content.slice(0, 50) + "..."
          : submission.post.content;

      await createNotification({
        userId:      submission.studentId,
        type:        "SUBMISSION_REVIEWED",
        message:     parsed.data.score !== undefined
          ? `Your submission for "${preview}" was graded ${parsed.data.score}/100.`
          : `Your submission for "${preview}" has been reviewed.`,
        referenceId: submission.postId,
        link:        `/student/classes/${submission.post.classId}/assignments`,
      });
    } catch (notifError) {
      console.warn("[PATCH /api/submissions/[submissionId]] Notification failed:", notifError);
    }

    await logAction({
      userId: profile.id,
      action: "REVIEW_SUBMISSION",
      resourceType: "SUBMISSION",
      resourceId: submissionId,
      details: {
        studentId: submission.studentId,
        postId: submission.postId,
        score: parsed.data.score ?? null,
        feedbackProvided: !!parsed.data.feedback
      }
    });

    return successResponse(updated, "Grade saved.");
  } catch (error) {
    console.error("[PATCH /api/submissions/[submissionId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { submissionId } = params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Rule 3: Enforce authorization
    if (submission.studentId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // Rule 1: Enforce status check
    if (submission.status !== "PENDING") {
      return errorResponse("Cannot unsubmit a graded or reviewed assignment.", 400);
    }

    // Rule 2: Delete physical file from storage
    if (submission.fileUrl) {
      const urlParts = submission.fileUrl.split("submissions/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const supabase = createClient();
        const { error } = await supabase.storage.from("submissions").remove([filePath]);
        if (error) {
          console.error("[DELETE /api/submissions/[submissionId]] Storage delete failed:", error);
        }
      }
    }

    // Delete database record
    await prisma.submission.delete({
      where: { id: submissionId },
    });

    return successResponse(null, "Submission removed successfully.");
  } catch (error) {
    console.error("[DELETE /api/submissions/[submissionId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
