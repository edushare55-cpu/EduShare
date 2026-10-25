"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Post, Comment } from "@/types";

// ─── Post Queries ─────────────────────────────────────────────────────────────

export function usePosts(classId: string) {
  return useQuery({
    queryKey: ["posts", classId],
    queryFn:  () => apiClient.get<Post[]>(`/api/posts?classId=${classId}`),
    enabled:  !!classId,
  });
}

/** Feed-only variant: strips assignment posts at the DB level. */
export function useFeedPosts(classId: string) {
  return useQuery({
    queryKey: ["posts", classId, "feed"],
    queryFn:  () => apiClient.get<Post[]>(`/api/posts?classId=${classId}&isSubmission=false`),
    enabled:  !!classId,
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ["posts", "detail", postId],
    queryFn:  () => apiClient.get<Post>(`/api/posts/${postId}`),
    enabled:  !!postId,
  });
}

// ─── Post Mutations ───────────────────────────────────────────────────────────

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      classId:              string;
      content:              string;
      category?:            string;
      isPinned?:            boolean;
      isSubmissionPost?:    boolean;
      submissionDeadline?:  string | null;
      attachedLink?:        string | null;
      files?: {
        fileName: string;
        fileUrl:  string;
        fileType: string;
        fileSize: number;
      }[];
    }) => apiClient.post<Post>("/api/posts", data),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["posts", post.classId] });
      toast.success("Post published!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePost(postId: string, classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content?:  string;
      category?: string;
      isPinned?: boolean;
    }) => apiClient.patch<Post>(`/api/posts/${postId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", classId] });
      qc.invalidateQueries({ queryKey: ["posts", "detail", postId] });
      toast.success("Post updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePost(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.delete(`/api/posts/${postId}`),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["posts", classId] })
      const previous = qc.getQueryData<Post[]>(["posts", classId])
      qc.setQueryData<Post[]>(["posts", classId], (old) =>
        old?.filter((p) => p.id !== postId) ?? []
      )
      return { previous }
    },
    onError: (err, _, ctx) => {
      qc.setQueryData(["posts", classId], ctx?.previous)
      toast.error(err.message || "Failed to delete post")
    },
    onSuccess: () => toast.success("Post deleted."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["posts", classId] })
    },
  });
}

export function useTogglePin(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      apiClient.patch<{ isPinned: boolean }>(`/api/posts/${postId}/pin`, {}),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["posts", classId] })
      const previous = qc.getQueryData<Post[]>(["posts", classId])
      qc.setQueryData<Post[]>(["posts", classId], (old) =>
        old?.map((p) =>
          p.id === postId ? { ...p, isPinned: !p.isPinned } : p
        ) ?? []
      )
      return { previous }
    },
    onError: (err: Error, _, ctx) => {
      qc.setQueryData(["posts", classId], ctx?.previous)
      toast.error(err.message || "Failed to update pin status.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["posts", classId] })
    },
  });
}

// ─── Comment Queries ──────────────────────────────────────────────────────────

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn:  () =>
      apiClient.get<Comment[]>(`/api/posts/${postId}/comments`),
    enabled: !!postId,
  });
}

// ─── Comment Mutations ────────────────────────────────────────────────────────

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post<Comment>(`/api/posts/${postId}/comments`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["posts", "detail", postId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete(`/api/posts/${postId}/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
