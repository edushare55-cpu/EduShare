"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Submission } from "@/types";

export function useSubmissions(postId: string) {
  return useQuery({
    queryKey: ["submissions", postId],
    queryFn:  () =>
      apiClient.get<Submission | Submission[]>(
        `/api/submissions?postId=${postId}`
      ),
    enabled: !!postId,
  });
}

export function useSubmitFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      postId:   string;
      fileUrl:  string;
      fileName: string;
      fileType: string;
    }) => apiClient.post<Submission>("/api/submissions", data),
    onSuccess: (submission) => {
      qc.invalidateQueries({
        queryKey: ["submissions", submission.postId],
      });
      toast.success("Assignment submitted!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReviewSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      postId,
      score,
      feedback,
    }: {
      submissionId: string;
      postId:       string;
      score?:       number;
      feedback?:    string;
    }) =>
      apiClient.patch<Submission>(`/api/submissions/${submissionId}`, {
        status: "REVIEWED",
        ...(score !== undefined ? { score } : {}),
        ...(feedback !== undefined ? { feedback } : {}),
      }),
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["submissions", postId] });
      qc.invalidateQueries({ queryKey: ["gradebook"] });
      qc.invalidateQueries({ queryKey: ["grades"] });
      qc.invalidateQueries({ queryKey: ["needs-grading"] });
      toast.success("Grade saved.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUnsubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
    }: {
      submissionId: string;
      postId:       string;
    }) => apiClient.delete(`/api/submissions/${submissionId}`),
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["submissions", postId] });
      toast.success("Submission removed.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useNeedsGrading(classId: string) {
  return useQuery({
    queryKey: ["needs-grading", classId],
    queryFn: () => apiClient.get<any[]>(`/api/classes/${classId}/needs-grading`),
    enabled: !!classId,
  });
}

export function useGradebook(classId: string) {
  return useQuery({
    queryKey: ["gradebook", classId],
    queryFn: () => apiClient.get<any>(`/api/classes/${classId}/gradebook`),
    enabled: !!classId,
  });
}

export function useStudentGrades(classId: string) {
  return useQuery({
    queryKey: ["grades", classId],
    queryFn: () => apiClient.get<any>(`/api/student/classes/${classId}/grades`),
    enabled: !!classId,
  });
}

export function useUpcomingDeadlines(classId: string) {
  return useQuery({
    queryKey: ["upcoming-deadlines", classId],
    queryFn: () => apiClient.get<any[]>(`/api/student/classes/${classId}/upcoming-deadlines`),
    enabled: !!classId,
  });
}
