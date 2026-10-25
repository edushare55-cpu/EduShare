"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Lesson, LessonWithStatus, LessonProgress } from "@/types";

// ─── Lesson Queries ────────────────────────────────────────────────────────────

export function useLessons(classId: string) {
  return useQuery({
    queryKey: ["lessons", classId],
    queryFn:  () => apiClient.get<LessonWithStatus[] | Lesson[]>(`/api/lessons?classId=${classId}`),
    enabled:  !!classId,
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", "detail", lessonId],
    queryFn:  () => apiClient.get<Lesson>(`/api/lessons/${lessonId}`),
    enabled:  !!lessonId,
  });
}

export function useLessonProgress(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", lessonId, "progress"],
    queryFn:  () => apiClient.get<LessonProgress | null>(`/api/lessons/${lessonId}/progress`),
    enabled:  !!lessonId,
  });
}

// ─── Lesson Mutations ─────────────────────────────────────────────────────────

export function useCreateLesson(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      classId:       string;
      title:         string;
      description?:  string;
      order:         number;
      videoUrl:      string;
      videoKey:      string;
      videoDuration: number;
      thumbnailUrl?: string;
      isPublished?:  boolean;
    }) => apiClient.post<Lesson>("/api/lessons", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", classId] });
      toast.success("Lesson created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateLesson(lessonId: string, classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?:        string;
      description?:  string;
      order?:        number;
      isPublished?:  boolean;
      thumbnailUrl?: string;
    }) => apiClient.patch<Lesson>(`/api/lessons/${lessonId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", classId] });
      qc.invalidateQueries({ queryKey: ["lessons", "detail", lessonId] });
      toast.success("Lesson updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLesson(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => apiClient.delete(`/api/lessons/${lessonId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", classId] });
      toast.success("Lesson deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReorderLesson(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, newOrder }: { lessonId: string; newOrder: number }) =>
      apiClient.patch<Lesson>(`/api/lessons/${lessonId}/reorder`, { newOrder }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", classId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Heartbeat Mutation ────────────────────────────────────────────────────────
// Called every 5 seconds by VideoPlayer component

export function useSendHeartbeat(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { watchedSeconds: number; highestSecond: number }) =>
      apiClient.post<{
        progress:       LessonProgress;
        isCompleted:    boolean;
        justCompleted:  boolean;
      }>(`/api/lessons/${lessonId}/progress`, { lessonId, ...data }),
    onSuccess: (result) => {
      qc.setQueryData(["lessons", lessonId, "progress"], result.progress);
      // If just completed, invalidate lesson list to update status badges
      if (result.justCompleted) {
        qc.invalidateQueries({ queryKey: ["lessons"] });
      }
    },
    // Silent — heartbeat failures should not show toasts
    onError: () => {},
  });
}
