"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiClient.patch<UserProfile>(`/api/admin/users/${userId}`, { isActive }),
    onSuccess: (updatedUser) => {
      // We might be fetching users via React Query in the future, or we can just let the page reload.
      // But typically we invalidate.
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`User ${updatedUser.isActive ? "activated" : "deactivated"}.`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/api/admin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User permanently deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
