/**
 * app/api/assessments/[assessmentId]/submissions/route.ts
 *
 * GET — Faculty: Get all student submissions/attempts for this assessment
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const { assessmentId } = params;

    // Verify Faculty owns this class
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { lesson: { select: { classId: true } } },
    });
    if (!assessment) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    const cls = await prisma.class.findUnique({
      where: { id: assessment.lesson.classId },
      select: { facultyId: true },
    });
    if (cls?.facultyId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // Fetch all attempts for this assessment, grouped by student
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { assessmentId },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { studentId: 'asc' },
        { attemptNumber: 'asc' }
      ]
    });

    return successResponse(attempts);
  } catch (error) {
    console.error("[GET /api/assessments/[assessmentId]/submissions]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
