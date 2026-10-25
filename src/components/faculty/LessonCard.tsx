"use client";

import React from "react";
import { Video, BookOpen, Clock, Eye, EyeOff, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types";
import { useDeleteLesson, useUpdateLesson, useReorderLesson } from "@/hooks/use-lessons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface LessonCardProps {
  lesson:      Lesson;
  classId:     string;
  isFirst:     boolean;
  isLast:      boolean;
  onEdit?:     (lesson: Lesson) => void;
  onManageAssessment?: (lesson: Lesson) => void;
  onViewSubmissions?:  (lesson: Lesson) => void;
}

export function LessonCard({
  lesson,
  classId,
  isFirst,
  isLast,
  onEdit,
  onManageAssessment,
  onViewSubmissions,
}: LessonCardProps) {
  const { mutate: deleteLesson, isPending: isDeleting } = useDeleteLesson(classId);
  const { mutate: updateLesson, isPending: isUpdating }  = useUpdateLesson(lesson.id, classId);
  const { mutate: reorder }                               = useReorderLesson(classId);

  const questionCount = (lesson.assessment as any)?._count?.questions ?? 0;

  const fmtDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
        "bg-surface-container-lowest hover:shadow-md",
        lesson.isPublished
          ? "border-outline-variant/30"
          : "border-outline-variant/20 opacity-80"
      )}
    >
      {/* Order badge + drag indicator */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary text-on-primary text-xs font-bold
                        flex items-center justify-center">
          {lesson.order}
        </div>
        <GripVertical className="w-4 h-4 text-on-surface-variant/40 group-hover:text-on-surface-variant transition-colors cursor-grab" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-on-surface text-sm leading-tight truncate">
              {lesson.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                <Clock className="w-3 h-3" />
                {fmtDuration(lesson.videoDuration)}
              </span>

              {/* Assessment badge */}
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md",
                lesson.assessment
                  ? questionCount > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                  : "bg-surface-container-high text-on-surface-variant"
              )}>
                <BookOpen className="w-3 h-3" />
                {lesson.assessment
                  ? questionCount > 0
                    ? `${questionCount} Question${questionCount === 1 ? "" : "s"}`
                    : "No questions yet"
                  : "No assessment"}
              </span>

              {/* Publish badge */}
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md",
                lesson.isPublished
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-high text-on-surface-variant"
              )}>
                {lesson.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {lesson.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6"
                disabled={isFirst}
                onClick={() => reorder({ lessonId: lesson.id, newOrder: lesson.order - 1 })}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6"
                disabled={isLast}
                onClick={() => reorder({ lessonId: lesson.id, newOrder: lesson.order + 1 })}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Kebab menu */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit?.(lesson)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageAssessment?.(lesson)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {lesson.assessment ? "Edit assessment" : "Add assessment"}
                </DropdownMenuItem>
                {lesson.assessment && (
                  <DropdownMenuItem onClick={() => onViewSubmissions?.(lesson)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View submissions
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updateLesson({ isPublished: !lesson.isPublished })
                  }
                  disabled={isUpdating}
                >
                  {lesson.isPublished ? (
                    <><EyeOff className="w-4 h-4 mr-2" />Unpublish</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-2" />Publish</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteLesson(lesson.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete lesson
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
