/**
 * app/api/assessments/[assessmentId]/questions/route.ts
 *
 * GET  — List questions for an assessment
 * POST — Faculty: Add a question (uses $transaction for choices/pairs)
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createQuestionSchema } from "@/lib/validations/lesson";

export const dynamic = "force-dynamic";

// ─── GET /api/assessments/[assessmentId]/questions ────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { assessmentId } = params;

    const questions = await prisma.question.findMany({
      where: { assessmentId },
      include: {
        choices:    { orderBy: { order: "asc" } },
        matchPairs: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    return successResponse(questions);
  } catch (error) {
    console.error("[GET /api/assessments/[assessmentId]/questions]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/assessments/[assessmentId]/questions ───────────────────────────

export async function POST(
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

    const { assessmentId } = params;
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

    const body = await request.json();
    const parsed = createQuestionSchema.safeParse({ ...body, assessmentId });
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const input = parsed.data;

    // Check for order conflict and shift if needed
    const existingOrder = await prisma.question.findUnique({
      where: { assessmentId_order: { assessmentId, order: input.order } },
    });
    if (existingOrder) {
      await prisma.question.updateMany({
        where: { assessmentId, order: { gte: input.order } },
        data:  { order: { increment: 1 } },
      });
    }

    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          assessmentId,
          type:         input.type,
          order:        input.order,
          questionText: input.questionText,
          points:       input.points,
          imageUrl:     input.imageUrl ?? null,
          explanation:  input.explanation ?? null,
        },
      });

      if (
        input.type === "MULTIPLE_CHOICE" ||
        input.type === "MULTIPLE_SELECT" ||
        input.type === "TRUE_OR_FALSE"
      ) {
        await tx.questionChoice.createMany({
          data: (input as any).choices.map((c: any) => ({ ...c, questionId: q.id })),
        });
      }

      if (input.type === "MATCHING") {
        await tx.matchPair.createMany({
          data: (input as any).matchPairs.map((p: any) => ({ ...p, questionId: q.id })),
        });
      }

      return q;
    });

    const fullQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        choices:    { orderBy: { order: "asc" } },
        matchPairs: { orderBy: { order: "asc" } },
      },
    });

    return successResponse(fullQuestion, "Question added.", 201);
  } catch (error) {
    console.error("[POST /api/assessments/[assessmentId]/questions]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
