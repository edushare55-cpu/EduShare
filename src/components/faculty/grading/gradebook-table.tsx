"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
} from "@tanstack/react-table";

interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Assignment {
  id: string;
  content: string;
  createdAt: string;
  submissionDeadline: string | null;
}

interface Assessment {
  id: string;
  title: string;
  passingScore: number;
  maxAttempts: number;
  lessonId: string;
  lessonTitle: string;
}

interface GradebookData {
  students: Student[];
  assignments: Assignment[];
  assessments: Assessment[];
  submissions: any[];
  attempts: any[];
}

export function GradebookTable({ data }: { data: GradebookData }) {
  const columnHelper = createColumnHelper<any>();

  // Flatten the data so each student is a row
  const tableData = useMemo(() => {
    return data.students.map((student) => {
      const row: any = { student };
      const recordedScores: number[] = [];

      // Map assignments
      data.assignments.forEach((assignment) => {
        const sub = data.submissions.find(
          (s) => s.studentId === student.id && s.postId === assignment.id
        );
        row[`assignment_${assignment.id}`] = sub;
        if (typeof sub?.score === "number") recordedScores.push(sub.score);
      });

      // Map assessments
      data.assessments.forEach((assessment) => {
        // Find best score attempt
        const stdAttempts = data.attempts.filter(
          (a) => a.studentId === student.id && a.assessmentId === assessment.id
        );
        
        let bestAttempt = null;
        if (stdAttempts.length > 0) {
          bestAttempt = stdAttempts.reduce((prev, current) => 
            (prev.score ?? 0) > (current.score ?? 0) ? prev : current
          );
        }
        row[`assessment_${assessment.id}`] = bestAttempt;
        if (typeof bestAttempt?.score === "number") recordedScores.push(bestAttempt.score);
      });

      row.overallGrade = recordedScores.length
        ? recordedScores.reduce((sum, score) => sum + score, 0) / recordedScores.length
        : null;
      row.gradedCount = recordedScores.length;
      return row;
    });
  }, [data]);

  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor("student", {
        header: "Student",
        cell: (info) => {
          const s = info.getValue();
          return (
            <div className="flex items-center gap-3 w-48 sticky left-0 bg-surface-container-lowest z-10 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {s.avatarUrl ? (
                  <img src={s.avatarUrl} alt={s.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  s.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-on-surface truncate w-32">{s.name}</span>
                <span className="text-[10px] text-on-surface-variant truncate w-32">{s.email}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("overallGrade", {
        header: () => <div className="min-w-[120px] text-xs font-semibold text-on-surface">Overall grade</div>,
        cell: (info) => {
          const grade = info.getValue() as number | null;
          const gradedCount = info.row.original.gradedCount as number;
          return grade === null ? (
            <span className="text-on-surface-variant">Not graded</span>
          ) : (
            <div className="flex flex-col">
              <span className={`font-bold ${grade >= 75 ? "text-green-700" : "text-red-600"}`}>
                {grade.toFixed(1)}%
              </span>
              <span className="text-[10px] text-on-surface-variant">{gradedCount} graded item{gradedCount === 1 ? "" : "s"}</span>
            </div>
          );
        },
      }),
    ];

    // Add Assignment Columns
    data.assignments.forEach((assignment) => {
      cols.push(
        columnHelper.accessor(`assignment_${assignment.id}`, {
          header: () => (
            <div className="flex flex-col min-w-[120px] max-w-[150px]">
              <span className="text-xs font-semibold truncate text-on-surface" title={assignment.content}>
                {assignment.content}
              </span>
              <span className="text-[10px] text-on-surface-variant font-normal">Assignment</span>
            </div>
          ),
          cell: (info) => {
            const sub = info.getValue();
            if (!sub) return <span className="text-on-surface-variant/50">—</span>;

            if (typeof sub.score === "number") {
              return (
                <div className="flex flex-col">
                  <span className="font-semibold text-green-700">{sub.score.toFixed(1)} / 100</span>
                  {sub.feedback && <span className="max-w-[150px] truncate text-[10px] text-on-surface-variant" title={sub.feedback}>Feedback saved</span>}
                </div>
              );
            }
            
            if (sub.status === "REVIEWED") {
              return <span className="text-amber-700 font-medium">Reviewed · no score</span>;
            }
            if (sub.status === "SUBMITTED") {
              return <span className="text-blue-600 font-medium">Needs Grading</span>;
            }
            return <span className="text-yellow-600 font-medium">{sub.status}</span>;
          },
        })
      );
    });

    // Add Assessment Columns
    data.assessments.forEach((assessment) => {
      cols.push(
        columnHelper.accessor(`assessment_${assessment.id}`, {
          header: () => (
            <div className="flex flex-col min-w-[120px] max-w-[150px]">
              <span className="text-xs font-semibold truncate text-on-surface" title={assessment.title}>
                {assessment.title}
              </span>
              <span className="text-[10px] text-on-surface-variant font-normal">Assessment</span>
            </div>
          ),
          cell: (info) => {
            const attempt = info.getValue();
            if (!attempt) return <span className="text-on-surface-variant/50">—</span>;

            if (attempt.score !== null) {
              const isPassing = attempt.score >= assessment.passingScore;
              return (
                <span className={`font-semibold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                  {attempt.score.toFixed(1)}%
                </span>
              );
            }
            if (attempt.status === "IN_PROGRESS" && attempt.submittedAt) {
              return <span className="text-blue-600 font-medium">Needs Grading</span>;
            }
            return <span className="text-yellow-600 font-medium">In Progress</span>;
          },
        })
      );
    });

    return cols;
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full overflow-auto border border-outline-variant/30 rounded-2xl bg-surface-container-lowest shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface-container/50 border-b border-outline-variant/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 font-medium align-bottom">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-container/30 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
