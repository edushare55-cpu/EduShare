"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Assessment, Question, AssessmentAttempt, AttemptSession, StudentAnswer } from "@/types";

// ─── Assessment Queries ───────────────────────────────────────────────────────

export function useAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ["assessments", assessmentId],
    queryFn:  () => apiClient.get<Assessment>(`/api/assessments/${assessmentId}`),
    enabled:  !!assessmentId,
  });
}

export function useAssessmentQuestions(assessmentId: string) {
  return useQuery({
    queryKey: ["assessments", assessmentId, "questions"],
    queryFn:  () => apiClient.get<Question[]>(`/api/assessments/${assessmentId}/questions`),
    enabled:  !!assessmentId,
  });
}

export function useAttemptHistory(assessmentId: string) {
  return useQuery({
    queryKey: ["assessments", assessmentId, "attempts"],
    queryFn:  () => apiClient.get<AssessmentAttempt[]>(`/api/assessments/${assessmentId}/attempts`),
    enabled:  !!assessmentId,
  });
}

export function useAttemptSession(assessmentId: string, attemptId: string) {
  return useQuery({
    queryKey: ["assessments", assessmentId, "attempts", attemptId],
    queryFn:  () =>
      apiClient.get<AttemptSession>(
        `/api/assessments/${assessmentId}/attempts/${attemptId}`
      ),
    enabled: !!assessmentId && !!attemptId,
  });
}

export function useAssessmentSubmissions(assessmentId: string) {
  return useQuery({
    queryKey: ["assessments", assessmentId, "submissions"],
    queryFn:  () =>
      apiClient.get<(AssessmentAttempt & { student: { id: string; name: string; email: string } })[]>(
        `/api/assessments/${assessmentId}/submissions`
      ),
    enabled: !!assessmentId,
  });
}

// ─── Assessment Mutations ─────────────────────────────────────────────────────

export function useCreateAssessment(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      lessonId:         string;
      title:            string;
      instructions?:    string;
      passingScore?:    number;
      maxAttempts?:     number;
      timeLimitMins?:   number | null;
      shuffleQuestions?: boolean;
      showResults?:     boolean;
    }) => apiClient.post<Assessment>("/api/assessments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Assessment created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAssessment(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{
      title:            string;
      instructions:     string;
      passingScore:     number;
      maxAttempts:      number;
      timeLimitMins:    number | null;
      shuffleQuestions: boolean;
      showResults:      boolean;
    }>) => apiClient.patch<Assessment>(`/api/assessments/${assessmentId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Assessment settings updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAssessment(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      apiClient.delete(`/api/assessments/${assessmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Assessment deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Question Mutations ───────────────────────────────────────────────────────

export function useCreateQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<Question>(
        `/api/assessments/${assessmentId}/questions`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId, "questions"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Question added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateQuestion(assessmentId: string, questionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{
      questionText: string;
      points:       number;
      imageUrl:     string;
      explanation:  string;
    }>) =>
      apiClient.patch<Question>(
        `/api/assessments/${assessmentId}/questions/${questionId}`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId, "questions"] });
      toast.success("Question updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      apiClient.delete(
        `/api/assessments/${assessmentId}/questions/${questionId}`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId, "questions"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Question deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Attempt Mutations ────────────────────────────────────────────────────────

export function useStartAttempt(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<AttemptSession>(
        `/api/assessments/${assessmentId}/attempts`,
        {}
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId, "attempts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSaveAnswer(assessmentId: string, attemptId: string) {
  return useMutation({
    mutationFn: (data: {
      questionId:        string;
      selectedChoiceIds?: string[];
      matchAnswers?:     { leftItem: string; selectedRightItem: string }[];
      textAnswer?:       string;
    }) =>
      apiClient.post<StudentAnswer>(
        `/api/assessments/${assessmentId}/attempts/${attemptId}/answers`,
        data
      ),
    // Silent — autosave should not show toasts on success
    onError: () => {},
  });
}

export function useSubmitAttempt(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      apiClient.patch<{
        attempt:                AssessmentAttempt;
        score:                  number;
        passed:                 boolean;
        passingScore:           number;
        hasPendingShortAnswers: boolean;
      }>(`/api/assessments/${assessmentId}/attempts/${attemptId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId, "attempts"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGradeShortAnswer(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      studentAnswerId: string;
      isCorrect:       boolean;
      pointsEarned:    number;
    }) =>
      apiClient.patch<{
        answer:               StudentAnswer;
        score:                number;
        passed:               boolean;
        pendingShortAnswers:  number;
      }>(`/api/assessments/${assessmentId}/grade`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments", assessmentId] });
      toast.success("Answer graded.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
