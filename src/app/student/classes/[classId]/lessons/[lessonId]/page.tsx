"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle, Lock, Trophy, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { useLesson, useLessonProgress } from "@/hooks/use-lessons";
import { useAttemptHistory, useStartAttempt } from "@/hooks/use-assessments";
import VideoPlayer from "@/components/shared/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function StudentLessonDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const classId  = params.classId  as string;
  const lessonId = params.lessonId as string;

  const { data: lesson,   isLoading: isLoadingLesson }   = useLesson(lessonId);
  const { data: progress, isLoading: isLoadingProgress } = useLessonProgress(lessonId);
  const { data: attempts = [] }                           = useAttemptHistory(lesson?.assessment?.id ?? "");
  const { mutate: startAttempt, isPending: isStarting }  = useStartAttempt(lesson?.assessment?.id ?? "");

  const [justCompleted, setJustCompleted] = useState(false);

  const isCompleted = progress?.isCompleted || justCompleted;
  const canTakeAssessment = isCompleted && !!lesson?.assessment;
  const hasPassedAssessment = attempts.some((a) => a.status === "PASSED");
  const inProgressAttempt   = attempts.find((a) => a.status === "IN_PROGRESS");

  const bestAttempt = attempts
    .filter((a) => a.status !== "IN_PROGRESS")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  const handleStartAssessment = () => {
    if (!lesson?.assessment) return;
    if (inProgressAttempt) {
      router.push(`/student/classes/${classId}/lessons/${lessonId}/assessment?attemptId=${inProgressAttempt.id}&aId=${lesson.assessment.id}`);
      return;
    }
    startAttempt(undefined, {
      onSuccess: (data) => {
        router.push(
          `/student/classes/${classId}/lessons/${lessonId}/assessment?attemptId=${data.attempt.id}&aId=${lesson!.assessment!.id}`
        );
      },
    });
  };

  if (isLoadingLesson || isLoadingProgress) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center py-20 text-on-surface-variant">
        Lesson not found.
      </div>
    );
  }

  const attemptsLeft = lesson.assessment
    ? lesson.assessment.maxAttempts === 0
      ? null
      : lesson.assessment.maxAttempts - attempts.length
    : null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      {/* Back link */}
      <Link href={`/student/classes/${classId}/lessons`}>
        <Button
          variant="ghost" size="sm"
          className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          All Lessons
        </Button>
      </Link>

      {/* Video Player */}
      <VideoPlayer
        src={lesson.videoUrl}
        lessonId={lesson.id}
        videoDuration={lesson.videoDuration}
        initialHighestSecond={progress?.highestSecond ?? 0}
        initialWatchedSeconds={progress?.watchedSeconds ?? 0}
        className="w-full aspect-video mb-6"
        onCompleted={() => setJustCompleted(true)}
      />

      {/* Lesson info */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">{lesson.description}</p>
            )}
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600
                             bg-green-50 border border-green-200 px-3 py-1.5 rounded-full shrink-0">
              <CheckCircle className="w-4 h-4" />
              Lesson Complete
            </span>
          )}
        </div>
      </div>

      {/* Assessment card */}
      {lesson.assessment && (
        <div
          className={cn(
            "rounded-2xl border p-6 transition-all",
            hasPassedAssessment
              ? "border-green-200 bg-green-50"
              : canTakeAssessment
              ? "border-primary/30 bg-primary/5"
              : "border-outline-variant/30 bg-surface-container-lowest opacity-75"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {hasPassedAssessment ? (
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
              ) : canTakeAssessment ? (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-on-surface-variant/40" />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-on-surface">{lesson.assessment.title}</h3>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-xs text-on-surface-variant">
                    Passing: {lesson.assessment.passingScore}%
                  </span>
                  {lesson.assessment.timeLimitMins && (
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.assessment.timeLimitMins} min
                    </span>
                  )}
                  {attemptsLeft !== null && (
                    <span className="text-xs text-on-surface-variant">
                      {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                    </span>
                  )}
                </div>

                {bestAttempt && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      bestAttempt.status === "PASSED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      Best: {bestAttempt.score?.toFixed(1)}%
                    </span>
                    <Link
                      href={`/student/classes/${classId}/lessons/${lessonId}/results`}
                      className="text-xs text-primary hover:underline"
                    >
                      View results
                    </Link>
                  </div>
                )}

                {!canTakeAssessment && (
                  <p className="text-xs text-on-surface-variant mt-2">
                    Watch at least 95% of the video to unlock.
                  </p>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <div className="shrink-0">
              {hasPassedAssessment ? (
                <Link href={`/student/classes/${classId}/lessons/${lessonId}/results`}>
                  <Button variant="outline" size="sm">
                    View Results
                  </Button>
                </Link>
              ) : canTakeAssessment && (attemptsLeft === null || attemptsLeft > 0) ? (
                <Button
                  onClick={handleStartAssessment}
                  disabled={isStarting}
                  className="bg-primary text-on-primary hover:opacity-90 min-w-[120px]"
                >
                  {isStarting
                    ? "Starting..."
                    : inProgressAttempt
                    ? "Resume"
                    : attempts.length > 0
                    ? <><RefreshCw className="w-4 h-4 mr-2" />Retry</>
                    : "Start Assessment"
                  }
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
