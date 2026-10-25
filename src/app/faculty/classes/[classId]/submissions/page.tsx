"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNeedsGrading } from "@/hooks/use-submissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, FileText, CheckCircle2, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function NeedsGradingPage() {
  const params = useParams();
  const classId = params.classId as string;
  const router = useRouter();

  const [filterType, setFilterType] = useState<"ALL" | "ASSIGNMENT" | "ASSESSMENT">("ALL");

  const { data: queue = [], isLoading } = useNeedsGrading(classId);

  const filteredQueue = useMemo(() => {
    if (filterType === "ALL") return queue;
    return queue.filter((item) => item.type === filterType);
  }, [queue, filterType]);

  const assignmentsCount = queue.filter((i) => i.type === "ASSIGNMENT").length;
  const assessmentsCount = queue.filter((i) => i.type === "ASSESSMENT").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <Link href={`/faculty/classes/${classId}`}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Class
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Needs Grading</h1>
          <p className="text-on-surface-variant text-base">Your unified triage board for pending student submissions.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          onClick={() => setFilterType("ALL")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filterType === "ALL" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-outline-variant/30 hover:border-primary/50"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Pending</p>
              <p className="text-3xl font-bold text-on-surface mt-1">{queue.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <Inbox className="w-6 h-6" />
            </div>
          </div>
        </Card>
        
        <Card
          onClick={() => setFilterType("ASSIGNMENT")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filterType === "ASSIGNMENT" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-outline-variant/30 hover:border-blue-500/50"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Assignments</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{assignmentsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card
          onClick={() => setFilterType("ASSESSMENT")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filterType === "ASSESSMENT" ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500" : "border-outline-variant/30 hover:border-purple-500/50"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Assessments</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">{assessmentsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Queue List */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">All Caught Up!</h3>
            <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
              There are no pending submissions that match your filters. Great job staying on top of your grading!
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {filteredQueue.map((item) => (
              <li key={item.id} className="hover:bg-surface-container/30 transition-colors group">
                <Link
                  href={`/faculty/classes/${classId}/grading/${item.type.toLowerCase()}/${item.id}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-5 gap-4"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'ASSIGNMENT' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'ASSIGNMENT' ? <FileText className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-on-surface truncate">{item.student.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        {item.type === 'ASSIGNMENT' ? 'Assignment' : 'Assessment'}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant truncate pr-4">{item.title}</p>
                  </div>

                  {/* Meta & Actions */}
                  <div className="flex items-center gap-6 sm:gap-8 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                    <div className="flex flex-col sm:items-end text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Submitted {formatDistanceToNow(new Date(item.submittedAt))} ago
                      </span>
                      {item.type === 'ASSESSMENT' && item.pendingQuestionCount && (
                        <span className="text-orange-600 font-medium mt-1">
                          {item.pendingQuestionCount} short answers pending
                        </span>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm" className="shrink-0 gap-1 rounded-xl group-hover:border-primary group-hover:text-primary transition-colors">
                      Grade
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
