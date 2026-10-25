"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Report } from "@/types";

export function useReports(status?: "PENDING" | "RESOLVED" | "DISMISSED") {
  return useQuery({
    queryKey: ["reports", { status }],
    queryFn:  () =>
      apiClient.get<{ reports: Report[]; total: number }>(
        `/api/reports${status ? `?status=${status}` : ""}`
      ),
  });
}

export function useFileReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      postId?:         string;
      reportedUserId?: string;
      reason:          string;
      description?:    string;
    }) => apiClient.post<Report>("/api/reports", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report submitted. Thank you.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      status,
      actionTaken,
    }: {
      reportId:     string;
      status:       "RESOLVED" | "DISMISSED";
      actionTaken?: string;
    }) =>
      apiClient.patch<Report>(`/api/reports/${reportId}`, {
        status,
        actionTaken,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report actioned successfully.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
