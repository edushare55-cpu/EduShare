/**
 * app/api/classes/[classId]/members/route.ts
 *
 * GET /api/classes/[classId]/members — List all enrolled students
 *   - Faculty (owner): full member list
 *   - Student (enrolled): full member list (to power the Classmates view)
 *   - Admin: full member list
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { classId } = params;

    if (profile.role === "FACULTY") {
      // Faculty must own this class
      const cls = await prisma.class.findUnique({ where: { id: classId }, select: { facultyId: true } });
      if (!cls) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
      if (cls.facultyId !== profile.id) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    } else if (profile.role === "STUDENT") {
      // Student must be enrolled in this class
      const membership = await prisma.classMembership.findUnique({
        where: { classId_studentId: { classId, studentId: profile.id } },
      });
      if (!membership) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }
    // ADMIN: no additional check needed

    const members = await prisma.classMembership.findMany({
      where: { classId },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatarUrl: true, department: true },
        },
      },
      orderBy: { student: { name: "asc" } },
    });

    return successResponse(members);
  } catch (error) {
    console.error("[GET /api/classes/[classId]/members]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
