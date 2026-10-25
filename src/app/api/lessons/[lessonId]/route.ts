/**
 * app/api/lessons/[lessonId]/route.ts
 *
 * GET    /api/lessons/[lessonId]  — Get lesson details
 * PATCH  /api/lessons/[lessonId]  — Faculty: Update lesson metadata
 * DELETE /api/lessons/[lessonId]  — Faculty: Delete lesson + video
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { updateLessonSchema } from "@/lib/validations/lesson";
import { createBulkNotifications } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/lessons/[lessonId] ──────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { lessonId } = params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        assessment: {
          include: {
            _count: { select: { questions: true, attempts: true } },
          },
        },
        ...(profile.role === "STUDENT"
          ? { progress: { where: { studentId: profile.id } } }
          : {}),
      },
    });

    if (!lesson) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Students can only see published lessons
    if (profile.role === "STUDENT" && !lesson.isPublished) {
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    }

    // Verify access
    if (profile.role === "FACULTY") {
      const cls = await prisma.class.findUnique({
        where: { id: lesson.classId },
        select: { facultyId: true },
      });
      if (cls?.facultyId !== profile.id) {
        return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
      }
    } else if (profile.role === "STUDENT") {
      const m = await prisma.classMembership.findUnique({
        where: { classId_studentId: { classId: lesson.classId, studentId: profile.id } },
      });
      if (!m) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    return successResponse(lesson);
  } catch (error) {
    console.error("[GET /api/lessons/[lessonId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/lessons/[lessonId] ────────────────────────────────────────────

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
    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: parsed.data,
      include: {
        assessment: { select: { id: true, title: true, _count: { select: { questions: true } } } },
      },
    });

    // If publishing for the first time, notify enrolled students
    if (parsed.data.isPublished === true && !lesson.isPublished) {
      try {
        const memberships = await prisma.classMembership.findMany({
          where: { classId: lesson.classId },
          select: { studentId: true },
        });
        await createBulkNotifications(
          memberships.map((m) => m.studentId),
          "LESSON_PUBLISHED",
          `New lesson available: "${updated.title}"`,
          updated.id
        );
      } catch (notifErr) {
        console.warn("[PATCH /api/lessons/[lessonId]] Notification failed:", notifErr);
      }
    }

    return successResponse(updated, "Lesson updated.");
  } catch (error) {
    console.error("[PATCH /api/lessons/[lessonId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── DELETE /api/lessons/[lessonId] ───────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
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

    // Delete video from Supabase Storage
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.storage.from("lesson-videos").remove([lesson.videoKey]);
    } catch (storageErr) {
      console.warn("[DELETE /api/lessons/[lessonId]] Storage removal failed:", storageErr);
    }

    // Delete lesson (Cascade handles Assessment, Questions, Progress)
    await prisma.lesson.delete({ where: { id: lessonId } });

    // Reorder remaining lessons to fill the gap
    const remaining = await prisma.lesson.findMany({
      where: { classId: lesson.classId },
      orderBy: { order: "asc" },
    });
    await Promise.all(
      remaining.map((l, index) =>
        prisma.lesson.update({ where: { id: l.id }, data: { order: index + 1 } })
      )
    );

    return successResponse(null, "Lesson deleted.");
  } catch (error) {
    console.error("[DELETE /api/lessons/[lessonId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
