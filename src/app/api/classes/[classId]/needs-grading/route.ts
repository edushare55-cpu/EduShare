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

    // Verify Faculty owns this class
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { facultyId: true },
    });
    
    if (!cls) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (cls.facultyId !== session.profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // 1. Get Pending Submissions (Assignments)
    const pendingSubmissions = await prisma.submission.findMany({
      where: {
        post: { classId },
        status: "SUBMITTED" // "SUBMITTED" means it was turned in but not yet "REVIEWED"
      },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
        post: { select: { id: true, content: true } }
      },
      orderBy: { submittedAt: 'asc' }
    });

    // 2. Get Pending Assessment Attempts (Needs manual grading for short answers)
    const pendingAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        assessment: {
          lesson: { classId }
        },
        submittedAt: { not: null },
        answers: {
          some: {
            isCorrect: null,
            question: {
              type: "SHORT_ANSWER"
            }
          }
        }
      },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assessment: { select: { id: true, title: true } },
        answers: {
          where: { isCorrect: null, question: { type: "SHORT_ANSWER" } },
          include: { question: true }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    // Normalize both into a unified "Needs Grading" queue
    const queue = [
      ...pendingSubmissions.map(s => ({
        id: s.id,
        type: 'ASSIGNMENT' as const,
        entityId: s.postId,
        title: s.post.content.substring(0, 50) + (s.post.content.length > 50 ? '...' : ''),
        student: s.student,
        submittedAt: s.submittedAt,
        details: s
      })),
      ...pendingAttempts.map(a => ({
        id: a.id,
        type: 'ASSESSMENT' as const,
        entityId: a.assessmentId,
        title: a.assessment.title,
        student: a.student,
        submittedAt: a.submittedAt!,
        pendingQuestionCount: a.answers.length,
        details: a
      }))
    ].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    return successResponse(queue);
  } catch (error) {
    console.error("[GET /api/classes/[classId]/needs-grading]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
