"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckCircle, Clock, Trophy, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { useLesson } from "@/hooks/use-lessons";
import { useAssessmentSubmissions } from "@/hooks/use-assessments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function FacultyAssessmentSubmissionsPage() {
  const params   = useParams();
  const classId  = params.classId as string;
  const lessonId = params.lessonId as string;
  const router   = useRouter();

  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const assessmentId = lesson?.assessment?.id ?? "";

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useAssessmentSubmissions(assessmentId);

  // Group attempts by student
  const studentMetrics = useMemo(() => {
    const map = new Map<string, {
      student: any;
      attempts: any[];
      bestScore: number | null;
      isPassed: boolean;
      status: string;
      latestAttemptId: string | null;
      pendingGrades: boolean;
    }>();

    submissions.forEach((attempt) => {
      const sId = attempt.studentId;
      if (!map.has(sId)) {
        map.set(sId, {
          student: attempt.student,
          attempts: [],
          bestScore: null,
          isPassed: false,
          status: "IN_PROGRESS",
          latestAttemptId: null,
          pendingGrades: false,
        });
      }
      const data = map.get(sId)!;
      data.attempts.push(attempt);
      
      if (attempt.score !== null) {
        if (data.bestScore === null || attempt.score > data.bestScore) {
          data.bestScore = attempt.score;
        }
      }
      if (attempt.status === "PASSED") data.isPassed = true;
      if (attempt.status === "IN_PROGRESS" && attempt.submittedAt !== null) data.pendingGrades = true;

      // Determine latest attempt for drilling down
      data.latestAttemptId = attempt.id; // since they are ordered asc by DB
    });

    return Array.from(map.values()).map(data => {
      // Determine overall status
      if (data.isPassed) data.status = "PASSED";
      else if (data.attempts.some(a => a.status === "FAILED")) data.status = "FAILED";
      else if (data.attempts.some(a => a.status === "IN_PROGRESS")) data.status = "IN_PROGRESS";
      
      return data;
    }).sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [submissions]);

  const isLoading = isLoadingLesson || (!!assessmentId && isLoadingSubmissions);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!lesson || !lesson.assessment) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full text-center py-20 text-on-surface-variant">
        No assessment found for this lesson.
      </div>
    );
  }

  const passedCount = studentMetrics.filter(s => s.isPassed).length;
  const pendingCount = studentMetrics.filter(s => s.pendingGrades).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header */}
      <Link href={`/faculty/classes/${classId}/lessons`}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Submissions: {lesson.assessment.title}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{lesson.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-center">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Passed</p>
            <p className="text-lg font-bold text-green-600">{passedCount}</p>
          </div>
          <div className="bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-center">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Total Submitted</p>
            <p className="text-lg font-bold text-primary">{studentMetrics.length}</p>
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-yellow-800">Manual Grading Required</h4>
            <p className="text-xs text-yellow-700 mt-1">
              {pendingCount} student{pendingCount !== 1 ? "s have" : " has"} pending short-answer questions that require your review.
            </p>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        {studentMetrics.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant flex flex-col items-center">
            <Users className="w-12 h-12 mb-3 text-outline-variant" />
            <p className="font-medium">No submissions yet.</p>
            <p className="text-sm mt-1">When students complete the assessment, their results will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-low text-xs uppercase font-semibold text-on-surface-variant border-b border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Best Score</th>
                  <th className="px-6 py-4">Attempts Used</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {studentMetrics.map((sm) => (
                  <tr key={sm.student.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-on-surface">{sm.student.name}</p>
                      <p className="text-xs text-on-surface-variant">{sm.student.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {sm.status === "PASSED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Passed
                        </span>
                      )}
                      {sm.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                      {sm.status === "IN_PROGRESS" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Clock className="w-3.5 h-3.5" /> In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sm.bestScore !== null ? (
                        <div className="flex items-center gap-2 font-mono font-semibold text-on-surface">
                          {sm.bestScore.toFixed(1)}%
                          {sm.bestScore >= lesson.assessment!.passingScore && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {sm.attempts.length} / {lesson.assessment!.maxAttempts === 0 ? "∞" : lesson.assessment!.maxAttempts}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sm.latestAttemptId && (
                        <Link href={`/faculty/classes/${classId}/lessons/${lessonId}/submissions/${sm.latestAttemptId}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" /> View Details
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
