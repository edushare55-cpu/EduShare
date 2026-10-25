/**
 * app/api/assessments/[assessmentId]/questions/[questionId]/route.ts
 *
 * PATCH  — Faculty: Update a question
 * DELETE — Faculty: Delete + reorder remaining questions
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

async function verifyFacultyAccess(assessmentId: string, profileId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { lesson: { select: { classId: true } } },
  });
  if (!assessment) return null;
  const cls = await prisma.class.findUnique({
    where: { id: assessment.lesson.classId },
    select: { facultyId: true },
  });
  if (cls?.facultyId !== profileId) return null;
  return assessment;
}

// ─── PATCH /api/assessments/[assessmentId]/questions/[questionId] ─────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { assessmentId: string; questionId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const access = await verifyFacultyAccess(params.assessmentId, profile.id);
    if (!access) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
    });
    if (!question || question.assessmentId !== params.assessmentId) {
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    }

    const body = await request.json();
    const { questionText, points, imageUrl, explanation } = body;

    const updated = await prisma.question.update({
      where: { id: params.questionId },
      data: {
        ...(questionText !== undefined && { questionText }),
        ...(points !== undefined && { points }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(explanation !== undefined && { explanation }),
      },
      include: {
        choices:    { orderBy: { order: "asc" } },
        matchPairs: { orderBy: { order: "asc" } },
      },
    });

    return successResponse(updated, "Question updated.");
  } catch (error) {
    console.error("[PATCH /api/assessments/[assessmentId]/questions/[questionId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── DELETE /api/assessments/[assessmentId]/questions/[questionId] ────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { assessmentId: string; questionId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const access = await verifyFacultyAccess(params.assessmentId, profile.id);
    if (!access) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
    });
    if (!question || question.assessmentId !== params.assessmentId) {
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    }

    await prisma.question.delete({ where: { id: params.questionId } });

    // Reorder remaining questions
    const remaining = await prisma.question.findMany({
      where: { assessmentId: params.assessmentId },
      orderBy: { order: "asc" },
    });
    await Promise.all(
      remaining.map((q, i) =>
        prisma.question.update({ where: { id: q.id }, data: { order: i } })
      )
    );

    return successResponse(null, "Question deleted.");
  } catch (error) {
    console.error("[DELETE /api/assessments/[assessmentId]/questions/[questionId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
