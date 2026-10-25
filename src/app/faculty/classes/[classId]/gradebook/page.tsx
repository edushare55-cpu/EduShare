"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGradebook } from "@/hooks/use-submissions";
import { GradebookTable } from "@/components/faculty/grading/gradebook-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function GradebookPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { data, isLoading, refetch, isRefetching } = useGradebook(classId);

  const exportGradebook = () => {
    if (!data) return;
    const assignments = data.assignments ?? [];
    const assessments = data.assessments ?? [];
    const rows: (string | number)[][] = [
      [
        "Student",
        "Email",
        ...assignments.map((assignment: any) => `${assignment.content} (out of 100)`),
        ...assessments.map((assessment: any) => `${assessment.title} (%)`),
        "Overall grade (%)",
      ],
      ...(data.students ?? []).map((student: any) => {
        const assignmentScores = assignments.map((assignment: any) => {
          const submission = data.submissions?.find(
            (item: any) => item.studentId === student.id && item.postId === assignment.id
          );
          return typeof submission?.score === "number" ? submission.score : "";
        });
        const assessmentScores = assessments.map((assessment: any) => {
          const attempts = (data.attempts ?? []).filter(
            (item: any) => item.studentId === student.id && item.assessmentId === assessment.id && typeof item.score === "number"
          );
          return attempts.length ? Math.max(...attempts.map((item: any) => item.score)) : "";
        });
        const scored = [...assignmentScores, ...assessmentScores]
          .filter((score) => typeof score === "number") as number[];
        const overall = scored.length
          ? (scored.reduce((sum, score) => sum + score, 0) / scored.length).toFixed(1)
          : "";
        return [student.name, student.email, ...assignmentScores, ...assessmentScores, overall];
      }),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "class-grading-system.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <Link href={`/faculty/classes/${classId}`}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Class
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Grading System</h1>
          <p className="text-on-surface-variant text-base">Review student work, record scores out of 100, and track class performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" className="gap-2 shadow-md" onClick={exportGradebook} disabled={!data}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-on-surface-variant">
        Scores use a 100-point scale. Overall grade is the average of recorded assignment scores and the best assessment attempt; ungraded work is excluded.
      </div>

      {isLoading || !data ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <GradebookTable data={data} />
      )}
    </div>
  );
}
