"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useStudentGrades } from "@/hooks/use-submissions";
import { StudentGradesDashboard } from "@/components/student/student-grades-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentClassSubmissionsPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { data, isLoading } = useStudentGrades(classId);

  if (isLoading || !data) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">My Grades & Progress</h1>
        <p className="text-on-surface-variant text-base">Track scored assignments and assessments, review feedback, and monitor your progress.</p>
      </div>

      <StudentGradesDashboard data={data} />
    </div>
  );
}
