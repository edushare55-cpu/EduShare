"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { usePosts } from "@/hooks/use-posts";

export default function StudentSubmissionsPage() {
  const { data: posts = [], isLoading } = usePosts("");

  const assignments = useMemo(() => {
    return posts
      .filter((p) => p.isSubmissionPost && p.submissionDeadline)
      .sort((a, b) => new Date(a.submissionDeadline!).getTime() - new Date(b.submissionDeadline!).getTime());
  }, [posts]);

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">My Submissions</h1>
        <p className="text-on-surface-variant text-lg">Track your upcoming assignments and deadlines.</p>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-on-surface-variant font-body-lg">Loading assignments...</div>
      ) : assignments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {assignments.map((assignment) => {
            const deadlineDate = new Date(assignment.submissionDeadline!);
            const isPastDue = deadlineDate < new Date();
            
            return (
              <Card key={assignment.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isPastDue ? "bg-surface-container-lowest opacity-70" : "bg-tertiary/5 border-tertiary/20"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPastDue ? "bg-surface-variant text-on-surface-variant" : "bg-tertiary-container text-on-tertiary-container"}`}>
                    <span className="material-symbols-outlined">{isPastDue ? "assignment_late" : "assignment"}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-surface line-clamp-1">{assignment.content.split(".")[0]}</h3>
                    <p className="font-body-sm text-on-surface-variant mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      {assignment.class?.name || "Class"}
                    </p>
                    <p className={`font-label-sm mt-1.5 ${isPastDue ? "text-error" : "text-tertiary"}`}>
                      Due: {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(deadlineDate)}
                    </p>
                  </div>
                </div>
                
                <Link
                  href={`/student/classes/${assignment.classId}/feed`}
                  className={`px-4 py-2 rounded-lg font-label-md text-label-md flex items-center justify-center transition-colors whitespace-nowrap ${isPastDue ? "bg-surface-container-low text-on-surface-variant hover:bg-surface-container" : "bg-tertiary text-on-tertiary hover:opacity-90"}`}
                >
                  View Details
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 text-on-surface-variant font-body-lg bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          No assignments found. You're all caught up!
        </div>
      )}
    </div>
  );
}
