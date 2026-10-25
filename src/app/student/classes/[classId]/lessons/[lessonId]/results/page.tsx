"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Trophy, X, CheckCircle, XCircle,
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Clock
} from "lucide-react";
import Link from "next/link";
import { useAttemptSession, useAttemptHistory } from "@/hooks/use-assessments";
import { useLesson } from "@/hooks/use-lessons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AssessmentResultsPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const classId      = params.classId  as string;
  const lessonId     = params.lessonId as string;
  const attemptId    = searchParams.get("attemptId") ?? "";

  const { data: lesson } = useLesson(lessonId);
  const { data: attempts = [], isLoading: isLoadingAttempts } = useAttemptHistory(
    lesson?.assessment?.id ?? ""
  );

  const attempt = attempts.find((a) => a.id === attemptId) ?? attempts[attempts.length - 1];
  const bestAttempt = attempts
    .filter((a) => a.status !== "IN_PROGRESS")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const hasPassed = attempts.some((a) => a.status === "PASSED");

  const [expandedQ, setExpandedQ] = React.useState<string | null>(null);

  if (isLoadingAttempts || !attempt) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const score        = attempt.score ?? 0;
  const passingScore = lesson?.assessment?.passingScore ?? 75;
  const passed       = attempt.status === "PASSED";
  const isPending    = attempt.status === "IN_PROGRESS";

  const circumference = 2 * Math.PI * 52;
  const dashOffset    = circumference - (score / 100) * circumference;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in duration-500">
      {/* Back */}
      <Link href={`/student/classes/${classId}/lessons/${lessonId}`}>
        <Button
          variant="ghost" size="sm"
          className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lesson
        </Button>
      </Link>

      {/* Score card */}
      <div className={cn(
        "rounded-2xl p-6 mb-6 border",
        isPending 
          ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
          : passed
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
      )}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <svg width={120} height={120} className="-rotate-90">
              <circle cx={60} cy={60} r={52} fill="none"
                stroke={isPending ? "#fef3c7" : passed ? "#dcfce7" : "#fee2e2"} strokeWidth={8} />
              <circle cx={60} cy={60} r={52} fill="none"
                stroke={isPending ? "#d97706" : passed ? "#16a34a" : "#dc2626"} strokeWidth={8}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: isPending ? "#d97706" : passed ? "#16a34a" : "#dc2626" }}>
                {isPending ? "?" : `${score.toFixed(0)}%`}
              </span>
            </div>
          </div>

          {/* Result text */}
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              {isPending ? (
                <Clock className="w-6 h-6 text-amber-600" />
              ) : passed ? (
                <Trophy className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h2 className="text-2xl font-bold" style={{ color: isPending ? "#d97706" : passed ? "#16a34a" : "#dc2626" }}>
                {isPending ? "Pending Review" : passed ? "Passed!" : "Not Passed"}
              </h2>
            </div>
            
            {isPending ? (
              <p className="text-sm text-on-surface-variant max-w-sm mt-1">
                Your assessment contains questions that require manual grading by your instructor. 
                Check back later for your final score.
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant">
                You scored <strong>{score.toFixed(1)}%</strong> · Passing: {passingScore}%
              </p>
            )}
            
            <p className="text-sm text-on-surface-variant mt-2">
              Attempt {attempt.attemptNumber} of{" "}
              {lesson?.assessment?.maxAttempts === 0
                ? "unlimited"
                : lesson?.assessment?.maxAttempts}
            </p>

            {/* Actions */}
            <div className="flex gap-2 mt-4 justify-center sm:justify-start">
              {!hasPassed &&
                lesson?.assessment?.maxAttempts !== undefined &&
                (lesson.assessment.maxAttempts === 0 ||
                  attempts.length < lesson.assessment.maxAttempts) && (
                  <Link href={`/student/classes/${classId}/lessons/${lessonId}`}>
                    <Button size="sm" className="bg-primary text-on-primary hover:opacity-90 gap-2">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try Again
                    </Button>
                  </Link>
                )}
              <Link href={`/student/classes/${classId}/lessons`}>
                <Button variant="outline" size="sm">
                  All Lessons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Attempt history */}
      {attempts.length > 1 && (
        <div className="mb-6 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Attempt History
          </h3>
          <div className="space-y-2">
            {attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <span className="text-sm text-on-surface">Attempt {a.attemptNumber}</span>
                <div className="flex items-center gap-2">
                  {a.status !== "IN_PROGRESS" && (
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      a.status === "PASSED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {a.score?.toFixed(1)}%
                    </span>
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    a.status === "PASSED" ? "text-green-600" : a.status === "FAILED" ? "text-red-600" : "text-on-surface-variant"
                  )}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answers breakdown */}
      {attempt.answers && attempt.answers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Answer Review
          </h3>
          <div className="space-y-3">
            {attempt.answers.map((ans, i) => (
              <div
                key={ans.id}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-all",
                  ans.isCorrect === true
                    ? "border-green-200 bg-green-50"
                    : ans.isCorrect === false
                    ? "border-red-200 bg-red-50"
                    : "border-outline-variant/30 bg-surface-container-lowest"
                )}
                onClick={() => setExpandedQ(expandedQ === ans.id ? null : ans.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ans.isCorrect === true ? (
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    ) : ans.isCorrect === false ? (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-outline-variant/50 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-on-surface">
                      Question {i + 1}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {ans.pointsEarned.toFixed(1)} pts
                    </span>
                  </div>
                  {expandedQ === ans.id ? (
                    <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  )}
                </div>
                {expandedQ === ans.id && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/20 text-sm text-on-surface-variant">
                    {ans.textAnswer && <p><strong>Your answer:</strong> {ans.textAnswer}</p>}
                    {ans.isCorrect === null && (
                      <p className="italic text-yellow-700">Pending manual grading by faculty.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
