/**
 * app/api/assessments/[assessmentId]/route.ts
 *
 * GET    — Get assessment (role-aware: strips isCorrect for students)
 * PATCH  — Faculty: Update assessment settings
 * DELETE — Faculty: Delete assessment (cascades to questions/attempts)
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { updateAssessmentSchema } from "@/lib/validations/lesson";

export const dynamic = "force-dynamic";

// ─── GET /api/assessments/[assessmentId] ──────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { assessmentId } = params;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        lesson: { select: { id: true, classId: true, title: true } },
        questions: {
          include: { choices: true, matchPairs: true },
          orderBy: { order: "asc" },
        },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!assessment) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Verify access
    if (profile.role === "FACULTY") {
      const cls = await prisma.class.findUnique({
        where: { id: assessment.lesson.classId },
        select: { facultyId: true },
      });
      if (cls?.facultyId !== profile.id) {
        return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
      }
      // Faculty gets full data including isCorrect
      return successResponse(assessment);
    }

    if (profile.role === "STUDENT") {
      const m = await prisma.classMembership.findUnique({
        where: { classId_studentId: { classId: assessment.lesson.classId, studentId: profile.id } },
      });
      if (!m) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

      // Check if student has a submitted attempt (to determine if explanation is visible)
      const submittedAttempt = await prisma.assessmentAttempt.findFirst({
        where: {
          assessmentId,
          studentId: profile.id,
          status: { in: ["PASSED", "FAILED"] },
        },
      });

      // Strip isCorrect from choices; strip explanation unless attempt submitted
      const studentView = {
        ...assessment,
        questions: assessment.questions.map((q) => ({
          ...q,
          explanation: submittedAttempt ? q.explanation : null,
          choices: q.choices.map(({ isCorrect: _stripped, ...c }) => c),
        })),
      };

      return successResponse(studentView);
    }

    return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
  } catch (error) {
    console.error("[GET /api/assessments/[assessmentId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/assessments/[assessmentId] ────────────────────────────────────

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
    const parsed = updateAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: parsed.data,
      include: { _count: { select: { questions: true, attempts: true } } },
    });

    return successResponse(updated, "Assessment updated.");
  } catch (error) {
    console.error("[PATCH /api/assessments/[assessmentId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── DELETE /api/assessments/[assessmentId] ───────────────────────────────────

export async function DELETE(
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

    await prisma.assessment.delete({ where: { id: assessmentId } });

    return successResponse(null, "Assessment deleted.");
  } catch (error) {
    console.error("[DELETE /api/assessments/[assessmentId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
