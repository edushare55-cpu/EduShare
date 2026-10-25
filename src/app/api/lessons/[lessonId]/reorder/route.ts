/**
 * app/api/lessons/[lessonId]/reorder/route.ts
 *
 * PATCH /api/lessons/[lessonId]/reorder — Faculty: Swap lesson order atomically
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { reorderLessonSchema } from "@/lib/validations/lesson";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const { lessonId } = params;
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Verify ownership
    const cls = await prisma.class.findUnique({
      where: { id: lesson.classId },
      select: { facultyId: true },
    });
    if (cls?.facultyId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = reorderLessonSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { newOrder } = parsed.data;

    if (newOrder === lesson.order) {
      return successResponse(lesson, "No change needed.");
    }

    // Find the lesson currently occupying the target position
    const conflicting = await prisma.lesson.findUnique({
      where: { classId_order: { classId: lesson.classId, order: newOrder } },
    });

    if (conflicting) {
      // Atomically swap the two orders
      await prisma.$transaction([
        prisma.lesson.update({
          where: { id: conflicting.id },
          data:  { order: lesson.order },
        }),
        prisma.lesson.update({
          where: { id: lesson.id },
          data:  { order: newOrder },
        }),
      ]);
    } else {
      // No conflict — just move
      await prisma.lesson.update({
        where: { id: lesson.id },
        data:  { order: newOrder },
      });
    }

    const updated = await prisma.lesson.findUnique({ where: { id: lessonId } });
    return successResponse(updated, "Lesson reordered.");
  } catch (error) {
    console.error("[PATCH /api/lessons/[lessonId]/reorder]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
