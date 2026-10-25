/**
 * app/api/assessments/route.ts
 *
 * POST /api/assessments — Faculty only: Create assessment for a lesson
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createAssessmentSchema } from "@/lib/validations/lesson";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { lessonId, title, instructions, passingScore, maxAttempts, timeLimitMins, shuffleQuestions, showResults } = parsed.data;

    // Fetch lesson and verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { class: { select: { facultyId: true } } },
    });
    if (!lesson) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (lesson.class.facultyId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // One assessment per lesson
    const existing = await prisma.assessment.findUnique({ where: { lessonId } });
    if (existing) {
      return errorResponse(
        "This lesson already has an assessment. Edit it instead.",
        ERRORS.CONFLICT.status
      );
    }

    const assessment = await prisma.assessment.create({
      data: {
        lessonId,
        title,
        instructions,
        passingScore,
        maxAttempts,
        timeLimitMins,
        shuffleQuestions,
        showResults,
      },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return successResponse(assessment, "Assessment created.", 201);
  } catch (error) {
    console.error("[POST /api/assessments]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
