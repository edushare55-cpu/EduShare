/**
 * app/api/lessons/route.ts
 *
 * GET  /api/lessons?classId=xxx  — Get all lessons for a section (role-aware)
 * POST /api/lessons               — Faculty only: Create a new lesson
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createLessonSchema } from "@/lib/validations/lesson";
import { createBulkNotifications } from "@/lib/notifications";
import type { LessonWithStatus, LessonStatus } from "@/types";

export const dynamic = "force-dynamic";

// ─── Access Helpers ────────────────────────────────────────────────────────────

async function verifyClassAccess(classId: string, profileId: string, role: string): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role === "FACULTY") {
    const cls = await prisma.class.findUnique({ where: { id: classId }, select: { facultyId: true } });
    return cls?.facultyId === profileId;
  }
  if (role === "STUDENT") {
    const m = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId, studentId: profileId } },
    });
    return !!m;
  }
  return false;
}

// ─── GET /api/lessons ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const classId = request.nextUrl.searchParams.get("classId");

    if (!classId) return errorResponse("classId query parameter is required.", 400);

    const hasAccess = await verifyClassAccess(classId, profile.id, profile.role);
    if (!hasAccess) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    // For students: run lessons + passed-attempts concurrently
    if (profile.role === "STUDENT") {
      const [lessons, passedAttempts] = await Promise.all([
        prisma.lesson.findMany({
          where: { classId, isPublished: true },
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                maxAttempts: true,
                timeLimitMins: true,
                shuffleQuestions: true,
                showResults: true,
                _count: { select: { questions: true, attempts: true } },
              },
            },
            progress: {
              where: { studentId: profile.id },
            },
          },
          orderBy: { order: "asc" },
        }),
        prisma.assessmentAttempt.findMany({
          where: {
            studentId: profile.id,
            status: "PASSED",
            assessment: { lesson: { classId } },
          },
          select: { assessment: { select: { lessonId: true } } },
        }),
      ]);

      const passedLessonIds = new Set(passedAttempts.map((a) => a.assessment.lessonId));

      const lessonsWithStatus: LessonWithStatus[] = lessons.map((lesson, index) => {
        const progressArr = (lesson as any).progress as any[];
        const progress = progressArr?.[0] ?? null;
        const prevLesson = index > 0 ? lessons[index - 1] : null;

        let status: LessonStatus = "LOCKED";

        if (index === 0) {
          status = progress?.isCompleted ? "COMPLETED" : "UNLOCKED";
        } else if (prevLesson) {
          const prevProgressArr = (prevLesson as any).progress as any[];
          const prevCompleted = prevProgressArr?.[0]?.isCompleted ?? false;
          const prevHasAssessment = !!(prevLesson as any).assessment;
          const prevAssessmentPassed = passedLessonIds.has(prevLesson.id);
          const prevFullyDone = prevCompleted && (!prevHasAssessment || prevAssessmentPassed);

          if (prevFullyDone) {
            status = progress?.isCompleted ? "COMPLETED" : "UNLOCKED";
          }
        }

        // Ensure createdAt and updatedAt are strings for type compatibility
        const createdAtStr =
          lesson.createdAt instanceof Date
            ? lesson.createdAt.toISOString()
            : (lesson.createdAt as any);
        const updatedAtStr =
          lesson.updatedAt instanceof Date
            ? lesson.updatedAt.toISOString()
            : (lesson.updatedAt as any);

        return {
          ...lesson,
          createdAt: createdAtStr,
          updatedAt: updatedAtStr,
          status,
          progress,
          canTakeAssessment:
            !!(lesson as any).assessment &&
            status !== "LOCKED" &&
            (progress?.isCompleted ?? false),
          assessmentPassed: passedLessonIds.has(lesson.id),
        } as LessonWithStatus;
      });

      return successResponse(lessonsWithStatus);
    }

    // Faculty/Admin: single query, no status computation needed
    const lessons = await prisma.lesson.findMany({
      where: { classId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            maxAttempts: true,
            timeLimitMins: true,
            shuffleQuestions: true,
            showResults: true,
            _count: { select: { questions: true, attempts: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return successResponse(lessons);
  } catch (error) {
    console.error("[GET /api/lessons]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/lessons ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { classId, title, description, order, videoUrl, videoKey, videoDuration, thumbnailUrl, isPublished } = parsed.data;

    // Verify faculty owns this class
    const cls = await prisma.class.findUnique({ where: { id: classId }, select: { facultyId: true } });
    if (!cls) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (cls.facultyId !== profile.id) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    // If order conflicts, shift existing lessons up
    const existing = await prisma.lesson.findUnique({
      where: { classId_order: { classId, order } },
    });
    if (existing) {
      await prisma.lesson.updateMany({
        where: { classId, order: { gte: order } },
        data: { order: { increment: 1 } },
      });
    }

    const lesson = await prisma.lesson.create({
      data: { classId, title, description, order, videoUrl, videoKey, videoDuration, thumbnailUrl, isPublished },
      include: {
        assessment: { select: { id: true, title: true, _count: { select: { questions: true } } } },
      },
    });

    // Notify enrolled students if published
    if (isPublished) {
      try {
        const memberships = await prisma.classMembership.findMany({
          where: { classId },
          select: { studentId: true },
        });
        await createBulkNotifications(
          memberships.map((m) => m.studentId),
          "LESSON_PUBLISHED",
          `New lesson available: "${title}"`,
          lesson.id
        );
      } catch (notifErr) {
        console.warn("[POST /api/lessons] Notification failed:", notifErr);
      }
    }

    return successResponse(lesson, "Lesson created successfully.", 201);
  } catch (error) {
    console.error("[POST /api/lessons]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
