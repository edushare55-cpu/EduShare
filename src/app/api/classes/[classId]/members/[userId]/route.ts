/**
 * app/api/classes/[classId]/members/[userId]/route.ts
 *
 * DELETE /api/classes/[classId]/members/[userId] — Faculty/Admin: Remove a student
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { classId: string; userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { classId, userId } = params;

    // Only Faculty (owner) or Admin can remove members
    if (profile.role === "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    if (profile.role === "FACULTY") {
      const cls = await prisma.class.findUnique({ where: { id: classId }, select: { facultyId: true } });
      if (!cls) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
      if (cls.facultyId !== profile.id) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const membership = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId, studentId: userId } },
    });

    if (!membership) {
      return errorResponse("Student is not enrolled in this section.", 404);
    }

    await prisma.classMembership.delete({
      where: { classId_studentId: { classId, studentId: userId } },
    });

    return successResponse(null, "Student removed from section.");
  } catch (error) {
    console.error("[DELETE /api/classes/[classId]/members/[userId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
