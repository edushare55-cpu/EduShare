"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn:  () => apiClient.get<UserProfile>("/api/profile"),
    staleTime: 1000 * 60 * 5,
  });
}
