"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useComments, useAddComment, useDeleteComment } from "@/hooks/use-posts";
import type { Comment } from "@/types";
import Link from "next/link";
import ReportModal from "./ReportModal";

export default function CommentThread({ postId, classId }: { postId: string; classId: string }) {
  const { user } = useAuthStore();
  const { data: comments = [], isLoading } = useComments(postId);
  const { mutate: addComment, isPending: isAdding } = useAddComment(postId);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment(postId);

  const [newComment, setNewComment] = useState("");
  const [reportData, setReportData] = useState<{ reportedUserId: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(newComment, {
      onSuccess: () => setNewComment(""),
    });
  };

  if (isLoading) {
    return <div className="p-4 text-on-surface-variant text-sm">Loading comments...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing Comments */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            const isAuthor = user?.id === comment.authorId;
            const canDelete = isAuthor || user?.role === "FACULTY";

            return (
              <div key={comment.id} className="flex gap-3 group relative">
                <Link 
                  href={user?.id === comment.authorId ? `/${user?.role.toLowerCase()}/profile` : `/${user?.role.toLowerCase()}/users/${comment.authorId}`}
                  className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold shrink-0 text-xs hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all cursor-pointer"
                >
                  {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    comment.author.name.charAt(0).toUpperCase()
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 inline-block">
                    <Link 
                      href={user?.id === comment.authorId ? `/${user?.role.toLowerCase()}/profile` : `/${user?.role.toLowerCase()}/users/${comment.authorId}`}
                      className="font-label-sm text-on-surface mb-1 flex items-center gap-2 hover:text-primary transition-colors hover:underline"
                    >
                      {comment.author.name}
                      {comment.author.role === "FACULTY" && (
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider no-underline">Faculty</span>
                      )}
                    </Link>
                    <p className="font-body-sm text-on-surface whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-on-surface-variant font-label-sm">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(comment.createdAt))}
                    </span>
                    {!isAuthor && (
                      <button
                        onClick={() => setReportData({ reportedUserId: comment.authorId })}
                        className="text-[10px] text-on-surface-variant hover:text-error transition-colors font-label-sm"
                      >
                        Report
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (confirm("Delete this comment?")) deleteComment(comment.id);
                        }}
                        disabled={isDeleting}
                        className="text-[10px] text-on-surface-variant hover:text-error transition-colors font-label-sm disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-on-surface-variant text-sm py-2">No comments yet. Be the first!</div>
      )}

      {/* Add Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 mt-2">
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0 text-xs">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-full px-4 py-2 font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isAdding}
            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </form>

      {reportData && (
        <ReportModal
          isOpen={!!reportData}
          onClose={() => setReportData(null)}
          postId={postId}
          reportedUserId={reportData.reportedUserId}
        />
      )}
    </div>
  );
}
