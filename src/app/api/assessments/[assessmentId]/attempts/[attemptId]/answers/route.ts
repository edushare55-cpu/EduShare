/**
 * app/api/assessments/[assessmentId]/attempts/[attemptId]/answers/route.ts
 *
 * POST — Student: Upsert a single answer (autosave during attempt)
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { saveAnswerSchema } from "@/lib/validations/lesson";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { assessmentId: string; attemptId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const { attemptId } = params;

    // Verify attempt belongs to student and is IN_PROGRESS
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt || attempt.studentId !== profile.id) {
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    }
    if (attempt.status !== "IN_PROGRESS") {
      return errorResponse("Cannot save answers to a submitted attempt.", 400);
    }

    // Check time limit has not expired
    if (attempt.timeLimitEnd && new Date() > new Date(attempt.timeLimitEnd)) {
      return errorResponse("The time limit for this attempt has expired.", 400);
    }

    const body = await request.json();
    const parsed = saveAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { questionId, selectedChoiceIds, matchAnswers, textAnswer } = parsed.data;

    // Verify question belongs to this assessment
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.assessmentId !== params.assessmentId) {
      return errorResponse("Question does not belong to this assessment.", 400);
    }

    const answer = await prisma.studentAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        selectedChoiceIds: selectedChoiceIds ?? [],
        matchAnswers:      matchAnswers ? JSON.parse(JSON.stringify(matchAnswers)) : null,
        textAnswer:        textAnswer ?? null,
      },
      update: {
        selectedChoiceIds: selectedChoiceIds ?? [],
        matchAnswers:      matchAnswers ? JSON.parse(JSON.stringify(matchAnswers)) : null,
        textAnswer:        textAnswer ?? null,
      },
    });

    return successResponse(answer);
  } catch (error) {
    console.error("[POST /api/assessments/[assessmentId]/attempts/[attemptId]/answers]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
