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

    // 1. Get Students
    const memberships = await prisma.classMembership.findMany({
      where: { classId },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { student: { name: 'asc' } }
    });
    const students = memberships.map(m => m.student);
    const studentIds = students.map(s => s.id);

    // 2. Get Assignments (Posts where isSubmissionPost = true)
    const assignments = await prisma.post.findMany({
      where: { classId, isSubmissionPost: true },
      select: { id: true, content: true, createdAt: true, submissionDeadline: true },
      orderBy: { createdAt: 'asc' }
    });

    // 3. Get Assessments (from Lessons in this class)
    const lessons = await prisma.lesson.findMany({
      where: { classId },
      include: {
        assessment: {
          select: { id: true, title: true, passingScore: true, maxAttempts: true, createdAt: true }
        }
      },
      orderBy: { order: 'asc' }
    });
    const assessments = lessons.filter(l => l.assessment).map(l => ({
      lessonId: l.id,
      lessonTitle: l.title,
      ...l.assessment!
    }));

    // 4. Get Submissions for these Assignments
    const submissions = await prisma.submission.findMany({
      where: {
        postId: { in: assignments.map(a => a.id) },
        studentId: { in: studentIds }
      },
      select: {
        id: true,
        postId: true,
        studentId: true,
        status: true,
        submittedAt: true,
        score: true,
        feedback: true,
      }
    });

    // 5. Get Assessment Attempts
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        assessmentId: { in: assessments.map(a => a.id) },
        studentId: { in: studentIds }
      },
      select: {
        id: true,
        assessmentId: true,
        studentId: true,
        attemptNumber: true,
        score: true,
        status: true,
        submittedAt: true,
      },
      orderBy: [
        { studentId: 'asc' },
        { assessmentId: 'asc' },
        { attemptNumber: 'desc' } // Get latest attempts first
      ]
    });

    // We might want to only take the best or latest attempt per student per assessment for the gradebook.
    // The frontend can handle filtering to best score or latest attempt.

    return successResponse({
      students,
      assignments,
      assessments,
      submissions,
      attempts
    });
  } catch (error) {
    console.error("[GET /api/classes/[classId]/gradebook]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
