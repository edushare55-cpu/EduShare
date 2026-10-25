"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy, X, CheckCircle, XCircle,
  ArrowLeft, ChevronDown, ChevronUp, Check, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useAttemptSession, useGradeShortAnswer } from "@/hooks/use-assessments";
import { useLesson } from "@/hooks/use-lessons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function FacultyAttemptReviewPage() {
  const params       = useParams();
  const classId      = params.classId  as string;
  const lessonId     = params.lessonId as string;
  const attemptId    = params.attemptId as string;

  const { data: lesson } = useLesson(lessonId);
  const assessmentId = lesson?.assessment?.id ?? "";

  const { data: session, isLoading, isError } = useAttemptSession(
    assessmentId,
    attemptId
  );

  const { mutate: gradeAnswer, isPending: isGrading } = useGradeShortAnswer(assessmentId);

  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">Failed to load attempt</h2>
        <p className="text-on-surface-variant mt-2">There was an error fetching the student's submission. Please try again.</p>
        <Link href={`/faculty/classes/${classId}/lessons/${lessonId}/submissions`}>
          <Button variant="outline" className="mt-6 gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !session) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const { attempt, assessment, questions } = session;

  const score        = attempt.score ?? 0;
  const passingScore = assessment.passingScore ?? 75;
  const passed       = attempt.status === "PASSED";

  const circumference = 2 * Math.PI * 52;
  const dashOffset    = circumference - (score / 100) * circumference;

  const handleGrade = (studentAnswerId: string, isCorrect: boolean, maxPoints: number) => {
    gradeAnswer({
      studentAnswerId,
      isCorrect,
      pointsEarned: isCorrect ? maxPoints : 0
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in duration-500">
      {/* Back */}
      <Link href={`/faculty/classes/${classId}/lessons/${lessonId}/submissions`}>
        <Button
          variant="ghost" size="sm"
          className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Submissions
        </Button>
      </Link>

      {/* Score card */}
      <div className={cn(
        "rounded-2xl p-6 mb-6 border",
        attempt.status === "IN_PROGRESS"
          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          : passed
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
      )}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <svg width={120} height={120} className="-rotate-90">
              <circle cx={60} cy={60} r={52} fill="none"
                stroke={attempt.status === "IN_PROGRESS" ? "#dbeafe" : passed ? "#dcfce7" : "#fee2e2"} strokeWidth={8} />
              <circle cx={60} cy={60} r={52} fill="none"
                stroke={attempt.status === "IN_PROGRESS" ? "#3b82f6" : passed ? "#16a34a" : "#dc2626"} strokeWidth={8}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: attempt.status === "IN_PROGRESS" ? "#3b82f6" : passed ? "#16a34a" : "#dc2626" }}>
                {score.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Result text */}
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              {attempt.status === "IN_PROGRESS" ? (
                <RefreshCw className="w-6 h-6 text-blue-600" />
              ) : passed ? (
                <Trophy className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h2 className="text-2xl font-bold" style={{ color: attempt.status === "IN_PROGRESS" ? "#3b82f6" : passed ? "#16a34a" : "#dc2626" }}>
                {attempt.status === "IN_PROGRESS" ? "Pending Review" : passed ? "Passed!" : "Not Passed"}
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant">
              Score: <strong>{score.toFixed(1)}%</strong> · Passing: {passingScore}%
            </p>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Attempt {attempt.attemptNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Answers breakdown */}
      {attempt.answers && attempt.answers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Answer Review
          </h3>
          <div className="space-y-3">
            {attempt.answers.map((ans, i) => {
              const question = questions.find(q => q.id === ans.questionId);
              if (!question) return null;

              return (
                <div
                  key={ans.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    ans.isCorrect === true
                      ? "border-green-200 bg-green-50"
                      : ans.isCorrect === false
                      ? "border-red-200 bg-red-50"
                      : "border-outline-variant/30 bg-surface-container-lowest"
                  )}
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedQ(expandedQ === ans.id ? null : ans.id)}
                  >
                    <div className="flex items-center gap-2">
                      {ans.isCorrect === true ? (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      ) : ans.isCorrect === false ? (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-blue-500 shrink-0 flex items-center justify-center">
                           <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-on-surface">
                        Question {i + 1}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {ans.pointsEarned.toFixed(1)} / {question.points} pts
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
                      <p className="mb-2 text-on-surface"><strong>Q:</strong> {question.questionText}</p>
                      
                      {ans.textAnswer && (
                         <div className="p-3 bg-surface-container-low rounded-lg mb-3 border border-outline-variant/20">
                           <p><strong>Student's Answer:</strong></p>
                           <p className="mt-1 whitespace-pre-wrap">{ans.textAnswer}</p>
                         </div>
                      )}

                      {question.type === "SHORT_ANSWER" && ans.isCorrect === null && (
                        <div className="mt-4 flex items-center gap-2">
                           <p className="font-semibold text-primary text-xs uppercase tracking-wider mr-2">Grade Answer:</p>
                           <Button 
                             size="sm" 
                             className="bg-green-600 hover:bg-green-700 text-white gap-2"
                             onClick={() => handleGrade(ans.id, true, question.points)}
                             disabled={isGrading}
                           >
                             <Check className="w-4 h-4" /> Correct
                           </Button>
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                             onClick={() => handleGrade(ans.id, false, question.points)}
                             disabled={isGrading}
                           >
                             <X className="w-4 h-4" /> Incorrect
                           </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
