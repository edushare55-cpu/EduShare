"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/types";
import { useReviewSubmission } from "@/hooks/use-submissions";

interface SubmissionTableProps {
  submissions: Submission[];
}

export function SubmissionTable({ submissions }: SubmissionTableProps) {
  const { mutate: reviewSubmission, isPending } = useReviewSubmission();

  const getStatusColor = (status: Submission["status"]) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-primary/10 text-primary hover:bg-primary/20";
      case "REVIEWED":
        return "bg-[#16a34a]/10 text-[#16a34a] hover:bg-[#16a34a]/20"; // Success Green
      case "PENDING":
      default:
        return "bg-error/10 text-error hover:bg-error/20"; // Red/Error
    }
  };

  const getStatusIcon = (status: Submission["status"]) => {
    switch (status) {
      case "SUBMITTED": return "check_circle";
      case "REVIEWED": return "verified";
      case "PENDING": return "pending_actions";
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest/30 rounded-2xl border border-outline-variant/20 border-dashed">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-3">inbox</span>
        <h3 className="text-lg font-semibold text-on-surface mb-1">No submissions found</h3>
        <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
          We couldn&apos;t find any student submissions matching your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/30 overflow-hidden bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container/50 text-on-surface-variant font-medium border-b border-outline-variant/30">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">File</th>
              <th className="px-6 py-4">Date Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-surface-container/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-semibold shrink-0">
                      {sub.student?.avatarUrl ? (
                        <img src={sub.student.avatarUrl} alt={sub.student.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(sub.student?.name || "Student")
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-on-surface block">{sub.student?.name}</span>
                      <span className="text-xs text-on-surface-variant">{sub.student?.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {sub.fileUrl ? (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline cursor-pointer w-fit">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      <span className="truncate max-w-[150px]">{sub.fileName}</span>
                    </a>
                  ) : (
                    <span className="text-on-surface-variant/60 italic">No file attached</span>
                  )}
                </td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {sub.submittedAt 
                    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(sub.submittedAt))
                    : "—"
                  }
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className={`flex items-center gap-1.5 w-fit font-medium ${getStatusColor(sub.status)} border-none shadow-none`}>
                    <span className="material-symbols-outlined text-[14px]">{getStatusIcon(sub.status)}</span>
                    {sub.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {sub.status === "SUBMITTED" && (
                    <button
                      onClick={() => reviewSubmission({ submissionId: sub.id, postId: sub.postId })}
                      disabled={isPending}
                      className="text-primary hover:text-primary/80 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      Mark Reviewed
                    </button>
                  )}
                  {sub.status === "REVIEWED" && (
                    <span className="text-[#16a34a] font-medium text-sm">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
