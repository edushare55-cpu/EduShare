import { z } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { errorResponse, ERRORS, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

async function canAccess(classId: string, profileId: string, role: string) {
  if (role === "ADMIN") return true;
  if (role === "FACULTY") {
    const course = await prisma.class.findUnique({
      where: { id: classId },
      select: { facultyId: true },
    });
    return course?.facultyId === profileId;
  }
  if (role === "STUDENT") {
    return !!(await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId, studentId: profileId } },
      select: { id: true },
    }));
  }
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { classId: string } },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return errorResponse(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.status,
      );
    if (
      !(await canAccess(
        params.classId,
        session.profile.id,
        session.profile.role,
      ))
    ) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const course = await prisma.class.findUnique({
      where: { id: params.classId },
      select: {
        id: true,
        name: true,
        subject: true,
        syllabusOverview: true,
        learningOutcomes: true,
        gradingPolicy: true,
        weeklySchedule: true,
        materials: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!course)
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    return successResponse(course);
  } catch (error) {
    console.error("[GET class syllabus]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

const syllabusSchema = z
  .object({
    syllabusOverview: z.string().max(10000).nullable().optional(),
    learningOutcomes: z.string().max(10000).nullable().optional(),
    gradingPolicy: z.string().max(10000).nullable().optional(),
    weeklySchedule: z.string().max(20000).nullable().optional(),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { classId: string } },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return errorResponse(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.status,
      );
    if (session.profile.role !== "FACULTY")
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const course = await prisma.class.findUnique({
      where: { id: params.classId },
      select: { facultyId: true },
    });
    if (!course)
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (course.facultyId !== session.profile.id)
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const parsed = syllabusSchema.safeParse(await request.json());
    if (!parsed.success)
      return errorResponse(
        parsed.error.errors[0].message,
        ERRORS.VALIDATION.status,
      );
    const updated = await prisma.class.update({
      where: { id: params.classId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        subject: true,
        syllabusOverview: true,
        learningOutcomes: true,
        gradingPolicy: true,
        weeklySchedule: true,
      },
    });
    return successResponse(updated, "Syllabus saved.");
  } catch (error) {
    console.error("[PATCH class syllabus]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
