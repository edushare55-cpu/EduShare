import { AttendanceStatus } from "@prisma/client";
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

    const [members, sessions] = await Promise.all([
      session.profile.role === "FACULTY"
        ? prisma.classMembership.findMany({
            where: { classId: params.classId },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                  approvalStatus: true,
                },
              },
            },
            orderBy: { student: { name: "asc" } },
          })
        : Promise.resolve([]),
      prisma.attendanceSession.findMany({
        where: { classId: params.classId },
        include: {
          records: {
            where:
              session.profile.role === "STUDENT"
                ? { studentId: session.profile.id }
                : undefined,
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);
    return successResponse({ members, sessions });
  } catch (error) {
    console.error("[GET class attendance]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

const statusSchema = z.nativeEnum(AttendanceStatus).nullable();
const attendanceSchema = z
  .object({
    sessionId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: z.string().trim().min(1).max(120),
    notes: z.string().max(2000).nullable().optional(),
    records: z
      .array(
        z.object({
          studentId: z.string().min(1),
          status: statusSchema,
        }),
      )
      .max(1000),
  })
  .strict();

export async function POST(
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

    const parsed = attendanceSchema.safeParse(await request.json());
    if (!parsed.success)
      return errorResponse(
        parsed.error.errors[0].message,
        ERRORS.VALIDATION.status,
      );
    const body = parsed.data;
    const sessionDate = new Date(`${body.date}T00:00:00.000Z`);
    if (
      Number.isNaN(sessionDate.getTime()) ||
      sessionDate.toISOString().slice(0, 10) !== body.date
    ) {
      return errorResponse(
        "Enter a valid attendance date.",
        ERRORS.VALIDATION.status,
      );
    }

    const distinctStudentIds = Array.from(
      new Set(body.records.map((record) => record.studentId)),
    );
    if (distinctStudentIds.length !== body.records.length) {
      return errorResponse(
        "A student can only appear once in an attendance list.",
        ERRORS.VALIDATION.status,
      );
    }
    const memberships = await prisma.classMembership.findMany({
      where: { classId: params.classId, studentId: { in: distinctStudentIds } },
      select: { studentId: true },
    });
    if (memberships.length !== distinctStudentIds.length) {
      return errorResponse(
        "Attendance can only be recorded for enrolled students.",
        ERRORS.VALIDATION.status,
      );
    }

    const saved = await prisma.$transaction(async (tx) => {
      let attendanceSession;
      if (body.sessionId) {
        attendanceSession = await tx.attendanceSession.findFirst({
          where: { id: body.sessionId, classId: params.classId },
          select: { id: true },
        });
        if (!attendanceSession) throw new Error("ATTENDANCE_SESSION_NOT_FOUND");
        await tx.attendanceSession.update({
          where: { id: attendanceSession.id },
          data: { sessionDate, title: body.title, notes: body.notes ?? null },
        });
      } else {
        attendanceSession = await tx.attendanceSession.findFirst({
          where: { classId: params.classId, sessionDate, title: body.title },
          select: { id: true },
        });
        if (attendanceSession) {
          await tx.attendanceSession.update({
            where: { id: attendanceSession.id },
            data: { notes: body.notes ?? null },
          });
        } else {
          attendanceSession = await tx.attendanceSession.create({
            data: {
              classId: params.classId,
              sessionDate,
              title: body.title,
              notes: body.notes ?? null,
            },
            select: { id: true },
          });
        }
      }

      for (const record of body.records) {
        if (record.status === null) {
          await tx.attendanceRecord.deleteMany({
            where: {
              sessionId: attendanceSession.id,
              studentId: record.studentId,
            },
          });
          continue;
        }
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: attendanceSession.id,
              studentId: record.studentId,
            },
          },
          create: {
            sessionId: attendanceSession.id,
            studentId: record.studentId,
            status: record.status,
          },
          update: { status: record.status },
        });
      }
      return attendanceSession;
    });

    return successResponse(saved, "Attendance saved.");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ATTENDANCE_SESSION_NOT_FOUND"
    ) {
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    }
    console.error("[POST class attendance]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
