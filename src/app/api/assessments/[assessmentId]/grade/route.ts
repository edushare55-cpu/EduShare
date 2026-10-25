/**
 * app/api/assessments/[assessmentId]/grade/route.ts
 *
 * PATCH — Faculty: Manually grade SHORT_ANSWER questions, recalculate total score
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { gradeShortAnswerSchema } from "@/lib/validations/lesson";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.assessmentId },
      include: { lesson: { select: { classId: true, title: true } } },
    });
    if (!assessment) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Verify faculty owns this class
    const cls = await prisma.class.findUnique({
      where: { id: assessment.lesson.classId },
      select: { facultyId: true },
    });
    if (cls?.facultyId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = gradeShortAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { studentAnswerId, isCorrect, pointsEarned } = parsed.data;

    // Verify the answer belongs to this assessment and cap grading at the
    // points assigned to its question.
    const targetAnswer = await prisma.studentAnswer.findUnique({
      where: { id: studentAnswerId },
      include: { question: true, attempt: true },
    });
    if (
      !targetAnswer ||
      targetAnswer.question.assessmentId !== assessment.id ||
      targetAnswer.attempt.assessmentId !== assessment.id
    ) {
      return errorResponse("Answer does not belong to this assessment.", 400);
    }
    if (pointsEarned > targetAnswer.question.points) {
      return errorResponse(`Score cannot exceed ${targetAnswer.question.points} points.`, 400);
    }

    // Update the specific student answer
    const studentAnswer = await prisma.studentAnswer.update({
      where: { id: studentAnswerId },
      data:  { isCorrect, pointsEarned },
      include: { attempt: true },
    });

    const attemptId = studentAnswer.attemptId;

    // Recalculate total score for this attempt
    const allAnswers = await prisma.studentAnswer.findMany({
      where: { attemptId },
    });
    const allQuestions = await prisma.question.findMany({
      where: { assessmentId: params.assessmentId },
    });

    const totalPoints  = allQuestions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = allAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const score        = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Check if all short-answer questions are now graded
    const pendingShortAnswers = allAnswers.filter(
      (a) => a.isCorrect === null
    ).length;

    const passed = pendingShortAnswers === 0 && score >= assessment.passingScore;
    const status = pendingShortAnswers > 0
      ? "IN_PROGRESS"
      : (passed ? "PASSED" : "FAILED");

    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data:  { score, earnedPoints, status },
    });

    // Notify student when fully graded
    if (pendingShortAnswers === 0) {
      try {
        await createNotification({
          userId:      studentAnswer.attempt.studentId,
          type:        "ASSESSMENT_GRADED",
          message:     `Your assessment "${assessment.title}" has been graded. You scored ${score.toFixed(1)}%.`,
          referenceId: params.assessmentId,
        });
      } catch (notifErr) {
        console.warn("[PATCH /api/assessments/[assessmentId]/grade] Notification failed:", notifErr);
      }
    }

    return successResponse({
      answer:  studentAnswer,
      attempt: updatedAttempt,
      score,
      passed,
      pendingShortAnswers,
    }, "Answer graded.");
  } catch (error) {
    console.error("[PATCH /api/assessments/[assessmentId]/grade]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
