/**
 * app/api/submissions/route.ts
 *
 * GET  /api/submissions?postId=xxx  — Get submissions for an assignment post
 * POST /api/submissions              — Student only: Submit a file
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createSubmissionSchema } from "@/lib/validations/post";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── GET /api/submissions ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const postId = request.nextUrl.searchParams.get("postId");

    if (!postId) return errorResponse("postId query parameter is required.", 400);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { class: { select: { id: true, facultyId: true } } },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    if (profile.role === "STUDENT") {
      // Students see only their own submission
      const submission = await prisma.submission.findUnique({
        where: { postId_studentId: { postId, studentId: profile.id } },
      });
      return successResponse(submission); // null = not submitted yet
    }

    if (profile.role === "FACULTY") {
      if (post.class.facultyId !== profile.id) {
        return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
      }
      const submissions = await prisma.submission.findMany({
        where: { postId },
        include: {
          student: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 100, // Limit memory usage
      });
      return successResponse(submissions);
    }

    if (profile.role === "ADMIN") {
      const submissions = await prisma.submission.findMany({
        where: { postId },
        include: {
          student: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 100, // Limit memory usage
      });
      return successResponse(submissions);
    }

    return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
  } catch (error) {
    console.error("[GET /api/submissions]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/submissions ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    // Only students can submit
    if (profile.role !== "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { postId, fileUrl, fileName, fileType } = parsed.data;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { class: { select: { id: true, name: true, facultyId: true } } },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Must be an assignment post
    if (!post.isSubmissionPost) {
      return errorResponse("This post does not accept submissions.", 400);
    }

    // Check deadline
    if (post.submissionDeadline && new Date() > new Date(post.submissionDeadline)) {
      return errorResponse("The submission deadline has passed.", 400);
    }

    // Verify student is enrolled
    const membership = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId: post.classId, studentId: profile.id } },
    });
    if (!membership) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // Upsert — allow re-upload before deadline
    const submission = await prisma.submission.upsert({
      where: { postId_studentId: { postId, studentId: profile.id } },
      create: {
        postId,
        studentId: profile.id,
        fileUrl,
        fileName,
        fileType,
        status: "SUBMITTED",
      },
      update: {
        fileUrl,
        fileName,
        fileType,
        status: "SUBMITTED",
        score: null,
        feedback: null,
        updatedAt: new Date(),
      },
    });

    // Notify faculty
    try {
      const preview = post.content.length > 50 ? post.content.slice(0, 50) + "..." : post.content;
      await createNotification({
        userId:      post.class.facultyId,
        type:        "NEW_SUBMISSION",
        message:     `${profile.name} submitted an assignment for "${preview}".`,
        referenceId: post.id,
        link:        `/faculty/classes/${post.classId}/assignments`,
      });
    } catch (notifError) {
      console.warn("[POST /api/submissions] Notification failed:", notifError);
    }

    return successResponse(submission, "Submission received.", 201);
  } catch (error) {
    console.error("[POST /api/submissions]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
