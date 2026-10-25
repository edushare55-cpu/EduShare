"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ClassSection, ClassMember } from "@/types";

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn:  () => apiClient.get<ClassSection[]>("/api/classes"),
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: ["classes", classId],
    queryFn:  () => apiClient.get<ClassSection>(`/api/classes/${classId}`),
    enabled:  !!classId,
  });
}

export function useClassMembers(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "members"],
    queryFn:  () =>
      apiClient.get<ClassMember[]>(`/api/classes/${classId}/members`),
    enabled: !!classId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name:         string;
      subject:      string;
      description?: string;
    }) => apiClient.post<ClassSection>("/api/classes", data),
    onSuccess: (newClass) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success(`Section "${newClass.name}" created!`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classCode: string) =>
      apiClient.post<ClassSection>("/api/classes/join", { classCode }),
    onSuccess: (joined) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success(`Joined "${joined.name}" successfully!`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateClass(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?:        string;
      description?: string;
      isArchived?:  boolean;
    }) => apiClient.patch<ClassSection>(`/api/classes/${classId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["classes", classId] });
      toast.success("Section updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteClass(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/api/classes/${classId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Section deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveMember(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/api/classes/${classId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", classId, "members"] });
      toast.success("Student removed from section.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
