"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?:       string;
      department?: string;
      avatarUrl?:  string;
    }) => apiClient.patch<UserProfile>("/api/profile", data),
    onSuccess: (updated) => {
      qc.setQueryData(["profile"], updated);
      toast.success("Profile updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: {
      currentPassword: string;
      newPassword:     string;
      confirmPassword: string;
    }) => apiClient.patch<null>("/api/profile/password", data),
    onSuccess: () => toast.success("Password changed successfully."),
    onError:   (err: Error) => toast.error(err.message),
  });
}
