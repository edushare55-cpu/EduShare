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

    const { classId } = params;
    const studentId = session.profile.id;

    // Verify Student is in this class
    const membership = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId, studentId } }
    });
    
    if (!membership) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    // Fetch posts that are submission posts, have a deadline in the future,
    // and the student has NOT yet submitted for them.
    const upcomingAssignments = await prisma.post.findMany({
      where: {
        classId,
        isSubmissionPost: true,
        submissionDeadline: {
          gt: new Date()
        },
        submissions: {
          none: {
            studentId
          }
        }
      },
      select: {
        id: true,
        content: true,
        submissionDeadline: true
      },
      orderBy: {
        submissionDeadline: 'asc'
      }
    });

    return successResponse(upcomingAssignments);
  } catch (error) {
    console.error("[GET /api/student/classes/[classId]/upcoming-deadlines]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
