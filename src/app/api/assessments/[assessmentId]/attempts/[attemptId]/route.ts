/**
 * app/api/assessments/[assessmentId]/attempts/[attemptId]/route.ts
 *
 * GET   — Resume attempt session (returns saved answers)
 * PATCH — Submit and auto-grade the attempt
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import type { AttemptQuestion, AttemptSession } from "@/types";

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export const dynamic = "force-dynamic";

// ─── GET /api/assessments/[assessmentId]/attempts/[attemptId] ─────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { assessmentId: string; attemptId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: params.attemptId },
      include: { answers: true },
    });
    if (!attempt) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.assessmentId },
      include: { lesson: { select: { id: true, classId: true, title: true } } },
    });
    if (!assessment) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    if (profile.role === "STUDENT") {
      if (attempt.studentId !== profile.id) {
        return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
      }
    } else if (profile.role === "FACULTY") {
      const cls = await prisma.class.findUnique({
        where: { id: assessment.lesson.classId },
        select: { facultyId: true },
      });
      if (cls?.facultyId !== profile.id) {
        return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
      }
    } else {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    let questions = await prisma.question.findMany({
      where: { assessmentId: params.assessmentId },
      include: {
        choices:    { orderBy: { order: "asc" } },
        matchPairs: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    if (assessment.shuffleQuestions) {
      questions = questions.sort((a, b) => hashString(a.id + attempt.attemptNumber) - hashString(b.id + attempt.attemptNumber));
    }

    const attemptQuestions: AttemptQuestion[] = questions.map((q) => {
      const savedAnswer = attempt.answers.find((a) => a.questionId === q.id) ?? null;
      return {
        id:           q.id,
        type:         q.type,
        order:        q.order,
        questionText: q.questionText,
        points:       q.points,
        imageUrl:     q.imageUrl,
        choices: (() => {
          let mappedChoices = q.choices.map(({ isCorrect: _stripped, ...c }) => c);
          if (assessment.shuffleQuestions) {
            mappedChoices = mappedChoices.sort((a, b) => hashString(a.id + attempt.id) - hashString(b.id + attempt.id));
          }
          return mappedChoices;
        })(),
        matchPairs:   q.type === "MATCHING"
          ? q.matchPairs.map(({ rightItem: _stripped, ...p }) => p)
          : undefined,
        shuffledRightItems: q.type === "MATCHING"
          ? q.matchPairs.map((p) => p.rightItem).sort((a, b) => (assessment.shuffleQuestions 
              ? hashString(a + attempt.id) - hashString(b + attempt.id) 
              : hashString(a) - hashString(b))) // Standard random but predictable sort if not explicitly shuffling questions
          : undefined,
        currentAnswer: savedAnswer as any,
      };
    });

    const now = Date.now();
    const timeRemaining = attempt.timeLimitEnd
      ? Math.max(0, Math.floor((new Date(attempt.timeLimitEnd).getTime() - now) / 1000))
      : null;

    const sessionData: AttemptSession = {
      attempt: attempt as any,
      assessment: assessment as any,
      questions: attemptQuestions,
      timeRemaining,
    };

    return successResponse(sessionData);
  } catch (error) {
    console.error("[GET /api/assessments/[assessmentId]/attempts/[attemptId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/assessments/[assessmentId]/attempts/[attemptId] ───────────────
// Submit and auto-grade

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { assessmentId: string; attemptId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: params.attemptId },
      include: { answers: true },
    });
    if (!attempt || attempt.studentId !== profile.id) {
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    }
    if (attempt.status !== "IN_PROGRESS") {
      return errorResponse("This attempt has already been submitted.", 400);
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.assessmentId },
      include: { lesson: { select: { id: true, classId: true, title: true } } },
    });
    if (!assessment) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Fetch all questions with correct answers
    const questions = await prisma.question.findMany({
      where: { assessmentId: params.assessmentId },
      include: { choices: true, matchPairs: true },
    });

    // ─── AUTO-GRADE ────────────────────────────────────────────────────────────
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradingUpdates: Promise<void>[] = [];

    for (const question of questions) {
      totalPoints += question.points;
      const answer = attempt.answers.find((a) => a.questionId === question.id);
      if (!answer) continue;

      let isCorrect: boolean | null = false;
      let pts = 0;

      switch (question.type) {
        case "MULTIPLE_CHOICE":
        case "TRUE_OR_FALSE": {
          const correctChoice = question.choices.find((c) => c.isCorrect);
          isCorrect = answer.selectedChoiceIds[0] === correctChoice?.id;
          pts = isCorrect ? question.points : 0;
          break;
        }
        case "MULTIPLE_SELECT": {
          const correctIds = new Set(question.choices.filter((c) => c.isCorrect).map((c) => c.id));
          const selectedIds = new Set(answer.selectedChoiceIds);
          const correctSelected = Array.from(selectedIds).filter((id) => correctIds.has(id)).length;
          const wrongSelected  = Array.from(selectedIds).filter((id) => !correctIds.has(id)).length;
          const partialRatio   = Math.max(0, (correctSelected - wrongSelected) / correctIds.size);
          isCorrect = correctSelected === correctIds.size && wrongSelected === 0;
          pts = question.points * partialRatio;
          break;
        }
        case "MATCHING": {
          const totalPairs = question.matchPairs.length;
          let correctPairs = 0;
          const matchAnswers = answer.matchAnswers as { leftItem: string; selectedRightItem: string }[] | null;
          if (matchAnswers) {
            for (const pair of question.matchPairs) {
              const studentAnswer = matchAnswers.find((a) => a.leftItem === pair.leftItem);
              if (studentAnswer?.selectedRightItem === pair.rightItem) correctPairs++;
            }
          }
          isCorrect = correctPairs === totalPairs;
          pts = question.points * (correctPairs / totalPairs);
          break;
        }
        case "SHORT_ANSWER": {
          // Cannot auto-grade — pending manual review
          isCorrect = null;
          pts = 0;
          break;
        }
      }

      earnedPoints += pts;
      gradingUpdates.push(
        prisma.studentAnswer
          .update({ where: { id: answer.id }, data: { isCorrect, pointsEarned: pts } })
          .then(() => void 0)
      );
    }

    await Promise.all(gradingUpdates);

    // Determine final status
    const hasShortAnswer = questions.some((q) => q.type === "SHORT_ANSWER");
    const score  = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = !hasShortAnswer && score >= assessment.passingScore;
    const status = hasShortAnswer ? "IN_PROGRESS" : (passed ? "PASSED" : "FAILED");

    const updated = await prisma.assessmentAttempt.update({
      where: { id: params.attemptId },
      data: {
        status,
        score,
        totalPoints,
        earnedPoints,
        submittedAt: new Date(),
      },
    });

    // Send result notification
    if (!hasShortAnswer) {
      try {
        await createNotification({
          userId:      profile.id,
          type:        passed ? "ASSESSMENT_PASSED" : "ASSESSMENT_FAILED",
          message:     passed
            ? `You passed "${assessment.title}" with ${score.toFixed(1)}%!`
            : `You scored ${score.toFixed(1)}% on "${assessment.title}". Need ${assessment.passingScore}% to pass.`,
          referenceId: assessment.lesson.id,
        });
      } catch (notifErr) {
        console.warn("[PATCH /api/assessments/[assessmentId]/attempts/[attemptId]] Notification failed:", notifErr);
      }
    }

    return successResponse({
      attempt: updated,
      score,
      passed,
      passingScore: assessment.passingScore,
      hasPendingShortAnswers: hasShortAnswer,
    }, "Attempt submitted.");
  } catch (error) {
    console.error("[PATCH /api/assessments/[assessmentId]/attempts/[attemptId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
