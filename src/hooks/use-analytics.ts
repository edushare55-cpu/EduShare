"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AnalyticsData } from "@/types";

export function useAnalytics() {
  return useQuery({
    queryKey:        ["analytics"],
    queryFn:         () => apiClient.get<AnalyticsData>("/api/analytics"),
    staleTime:       1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}
