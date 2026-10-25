/**
 * app/api/lessons/[lessonId]/progress/route.ts
 *
 * GET  /api/lessons/[lessonId]/progress  — Get student's progress
 * POST /api/lessons/[lessonId]/progress  — Heartbeat: update progress (every 5s)
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { lessonProgressSchema } from "@/lib/validations/lesson";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── GET /api/lessons/[lessonId]/progress ─────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_studentId: {
          lessonId: params.lessonId,
          studentId: profile.id,
        },
      },
    });

    return successResponse(progress); // null = not started yet
  } catch (error) {
    console.error("[GET /api/lessons/[lessonId]/progress]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/lessons/[lessonId]/progress ────────────────────────────────────
// Heartbeat — called every 5 seconds while student is watching

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    if (profile.role !== "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = lessonProgressSchema.safeParse({ ...body, lessonId: params.lessonId });
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { lessonId } = params;
    const { watchedSeconds, highestSecond } = parsed.data;

    // Fetch lesson to get videoDuration
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { assessment: { select: { id: true, title: true } } },
    });
    if (!lesson) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Verify enrollment
    const m = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId: lesson.classId, studentId: profile.id } },
    });
    if (!m) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const existing = await prisma.lessonProgress.findUnique({
      where: { lessonId_studentId: { lessonId, studentId: profile.id } },
    });

    // ─── ANTI-SKIP LOGIC ─────────────────────────────────────────────────────
    // highestSecond can ONLY increase — never decrease.
    // It is also capped at watchedSeconds + 10s to prevent timestamp spoofing.
    const newHighestSecond = Math.max(
      existing?.highestSecond ?? 0,
      Math.min(highestSecond, (existing?.watchedSeconds ?? 0) + 10)
    );

    // watchedSeconds = actual cumulative time spent watching
    const newWatchedSeconds = Math.max(
      existing?.watchedSeconds ?? 0,
      watchedSeconds
    );

    // Complete when highestSecond >= 95% of total duration
    const completionThreshold = Math.floor(lesson.videoDuration * 0.95);
    const isCompleted = newHighestSecond >= completionThreshold;
    const justCompleted = isCompleted && !(existing?.isCompleted ?? false);

    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId, studentId: profile.id } },
      create: {
        lessonId,
        studentId:     profile.id,
        watchedSeconds: newWatchedSeconds,
        highestSecond:  newHighestSecond,
        isCompleted,
        completedAt:   isCompleted ? new Date() : null,
        lastHeartbeat: new Date(),
      },
      update: {
        watchedSeconds: newWatchedSeconds,
        highestSecond:  newHighestSecond,
        isCompleted,
        completedAt:   justCompleted
          ? new Date()
          : existing?.completedAt,
        lastHeartbeat: new Date(),
      },
    });

    // On first completion: notify student that assessment is unlocked
    if (justCompleted) {
      try {
        if (lesson.assessment) {
          await createNotification({
            userId:      profile.id,
            type:        "LESSON_COMPLETED",
            message:     `You completed "${lesson.title}"! The assessment is now unlocked.`,
            referenceId: lesson.id,
          });
        }
      } catch (notifErr) {
        console.warn("[POST /api/lessons/[lessonId]/progress] Notification failed:", notifErr);
      }
    }

    return successResponse({ progress, isCompleted, justCompleted });
  } catch (error) {
    console.error("[POST /api/lessons/[lessonId]/progress]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
