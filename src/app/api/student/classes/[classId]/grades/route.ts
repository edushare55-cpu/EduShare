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

    // Batch 1: Assignments and Lessons are independent — run concurrently
    const [assignments, lessons] = await Promise.all([
      prisma.post.findMany({
        where: { classId, isSubmissionPost: true },
        select: { id: true, content: true, submissionDeadline: true, createdAt: true }
      }),
      prisma.lesson.findMany({
        where: { classId },
        include: {
          assessment: {
            select: { id: true, title: true, passingScore: true, maxAttempts: true, createdAt: true }
          }
        }
      }),
    ]);

    const assessments = lessons.filter(l => l.assessment).map(l => ({
      lessonId: l.id,
      lessonTitle: l.title,
      ...l.assessment!
    }));

    // Batch 2: Submissions and Attempts depend on batch 1 IDs but are independent of each other
    const [submissions, attempts] = await Promise.all([
      prisma.submission.findMany({
        where: {
          studentId,
          postId: { in: assignments.map(a => a.id) }
        }
      }),
      prisma.assessmentAttempt.findMany({
        where: {
          studentId,
          assessmentId: { in: assessments.map(a => a.id) }
        },
        orderBy: { attemptNumber: 'desc' }
      }),
    ]);

    // Normalize into a single unified feed
    const feed = [];
    
    // Process Assignments
    for (const assignment of assignments) {
      const submission = submissions.find(s => s.postId === assignment.id);
      feed.push({
        id: `assignment_${assignment.id}`,
        type: 'ASSIGNMENT',
        entityId: assignment.id,
        title: assignment.content.substring(0, 60) + (assignment.content.length > 60 ? '...' : ''),
        dueDate: assignment.submissionDeadline,
        createdAt: assignment.createdAt,
        status: submission ? submission.status : 'MISSING',
        score: submission?.score ?? null,
        feedback: submission?.feedback ?? null,
        submittedAt: submission?.submittedAt || null,
        details: submission
      });
    }

    // Process Assessments
    for (const assessment of assessments) {
      const assessmentAttempts = attempts.filter(a => a.assessmentId === assessment.id);
      const bestAttempt = assessmentAttempts.length > 0 
        ? assessmentAttempts.reduce((prev, current) => (prev.score ?? 0) > (current.score ?? 0) ? prev : current)
        : null;

      let status = 'MISSING';
      if (bestAttempt) {
        if (bestAttempt.status === 'PASSED' || bestAttempt.status === 'FAILED') status = 'GRADED';
        else if (bestAttempt.submittedAt) status = 'PENDING';
        else status = 'IN_PROGRESS';
      }

      feed.push({
        id: `assessment_${assessment.id}`,
        type: 'ASSESSMENT',
        entityId: assessment.id,
        title: assessment.title,
        dueDate: null, // Assessments don't have hard deadlines in schema yet
        createdAt: assessment.createdAt,
        status,
        score: bestAttempt?.score ?? null,
        passingScore: assessment.passingScore,
        submittedAt: bestAttempt?.submittedAt || null,
        details: bestAttempt
      });
    }

    // Sort feed chronologically by creation/due date
    feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate Summary Stats
    const gradedItems = feed.filter(f => typeof f.score === "number");
    
    let overallGrade = 0;
    if (gradedItems.length > 0) {
      const sum = gradedItems.reduce((acc, curr) => acc + curr.score, 0);
      overallGrade = sum / gradedItems.length;
    }

    const completionRate = feed.length > 0 
      ? Math.round((feed.filter(f => f.status !== 'MISSING' && f.status !== 'IN_PROGRESS').length / feed.length) * 100) 
      : 100;

    return successResponse({
      feed,
      stats: {
        overallGrade: Math.round(overallGrade * 10) / 10,
        completionRate,
        totalMissing: feed.filter(f => f.status === 'MISSING').length,
        totalItems: feed.length
      }
    });

  } catch (error) {
    console.error("[GET /api/student/classes/[classId]/grades]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
