"use client";

import React from "react";
import { useParams } from "next/navigation";
import { usePosts } from "@/hooks/use-posts";
import PostCard from "@/components/shared/PostCard";
import { ClipboardList } from "lucide-react";

export default function StudentAssignmentsPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { data: posts = [], isLoading } = usePosts(classId);
  const assignments = posts.filter(p => p.isSubmissionPost);

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Assignments</h1>
        <p className="text-on-surface-variant text-lg">View your assigned coursework, download resources, and submit your files.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-surface-container-lowest rounded-xl h-[300px] animate-pulse border border-outline-variant/30" />
          ))}
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map(assignment => (
            <PostCard key={assignment.id} post={assignment} isFacultyView={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">No Assignments Yet</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">Your instructor hasn't posted any assignments for this class yet. Enjoy the free time!</p>
        </div>
      )}
    </div>
  );
}
