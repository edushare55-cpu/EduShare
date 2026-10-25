"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock, Play, CheckCircle, BookOpen, Clock, ChevronRight } from "lucide-react";
import { useLessons } from "@/hooks/use-lessons";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LessonWithStatus, LessonStatus } from "@/types";

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LessonStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                        bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Completed
      </span>
    );
  }
  if (status === "UNLOCKED") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                        bg-primary/10 text-primary">
        <Play className="w-3 h-3" style={{ fill: "currentColor" }} />
        Start
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
                      bg-surface-container text-on-surface-variant">
      <Lock className="w-3 h-3" />
      Locked
    </span>
  );
}

// ─── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, index }: { lesson: LessonWithStatus; index: number }) {
  const isLocked   = lesson.status === "LOCKED";
  const progressPct = lesson.progress
    ? Math.min(
        (lesson.progress.highestSecond / (lesson.videoDuration || 1)) * 100,
        100
      )
    : 0;

  const fmtDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
  };

  const rowContent = (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        "bg-surface-container-lowest",
        isLocked
          ? "border-outline-variant/20 opacity-60 cursor-not-allowed"
          : "border-outline-variant/30 hover:shadow-md hover:border-primary/30 cursor-pointer group"
      )}
    >
      {/* Order + Progress Ring */}
      <div className="relative shrink-0">
        <ProgressRing
          size={52}
          strokeWidth={4}
          percent={lesson.status === "COMPLETED" ? 100 : progressPct}
          color={lesson.status === "COMPLETED" ? "#16a34a" : "#00236f"}
          trackColor="#e6e8ea"
        >
          {lesson.status === "COMPLETED" ? (
            <CheckCircle className="w-4 h-4 text-green-600" style={{ fill: "none" }} />
          ) : isLocked ? (
            <Lock className="w-4 h-4 text-on-surface-variant/40" />
          ) : (
            <span className="text-sm font-bold text-primary">{lesson.order}</span>
          )}
        </ProgressRing>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-semibold text-sm leading-tight",
          isLocked ? "text-on-surface-variant" : "text-on-surface group-hover:text-primary transition-colors"
        )}>
          {lesson.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Clock className="w-3 h-3" />
            {fmtDuration(lesson.videoDuration)}
          </span>
          {lesson.assessment && (
            <span className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md",
              lesson.assessmentPassed
                ? "bg-green-100 text-green-700"
                : lesson.canTakeAssessment
                ? "bg-primary/10 text-primary"
                : "bg-surface-container text-on-surface-variant"
            )}>
              <BookOpen className="w-3 h-3" />
              {lesson.assessmentPassed
                ? "Assessment Passed"
                : lesson.canTakeAssessment
                ? "Assessment Unlocked"
                : "Assessment"}
            </span>
          )}
        </div>
        {lesson.progress && lesson.status !== "COMPLETED" && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-on-surface-variant tabular-nums">
              {progressPct.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Right arrow */}
      {!isLocked && (
        <ChevronRight className="w-5 h-5 text-on-surface-variant/50 group-hover:text-primary
                                  transition-colors shrink-0" />
      )}
    </div>
  );

  if (isLocked) return rowContent;

  return (
    <Link href={`/student/classes/${lesson.classId}/lessons/${lesson.id}`}>
      {rowContent}
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentLessonsPage() {
  const params  = useParams();
  const classId = params.classId as string;

  const { data: lessons = [], isLoading, isError } = useLessons(classId);
  const typedLessons = lessons as LessonWithStatus[];

  const completed  = typedLessons.filter((l) => l.status === "COMPLETED").length;
  const totalPct   = typedLessons.length > 0 ? (completed / typedLessons.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in duration-300">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full text-center py-20 text-on-surface-variant">
        Failed to load lessons.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Video Lessons</h2>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {completed} of {typedLessons.length} completed
          </p>
        </div>
        {typedLessons.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            <ProgressRing size={56} strokeWidth={5} percent={totalPct} color="#00236f">
              <span className="text-xs font-bold text-primary">{Math.round(totalPct)}%</span>
            </ProgressRing>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      {typedLessons.length > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Lesson list */}
      {typedLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant
                        border-2 border-dashed border-outline-variant/30 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-on-surface">No lessons available</p>
          <p className="text-sm text-center mt-1 max-w-xs">
            Your teacher hasn&apos;t published any lessons yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {typedLessons.map((lesson, index) => (
            <LessonRow key={lesson.id} lesson={lesson} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
