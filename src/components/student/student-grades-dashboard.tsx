"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2, FileText, AlertCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { FeedbackViewer } from "./feedback-viewer";

interface GradesDashboardProps {
  data: {
    feed: any[];
    stats: {
      overallGrade: number;
      completionRate: number;
      totalMissing: number;
      totalItems: number;
    };
  };
}

export function StudentGradesDashboard({ data }: GradesDashboardProps) {
  const { feed, stats } = data;
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"todo" | "completed">("todo");

  const todoFeed = useMemo(() => feed.filter(item => item.status === 'MISSING' || item.status === 'IN_PROGRESS'), [feed]);
  const completedFeed = useMemo(() => feed.filter(item => item.status !== 'MISSING' && item.status !== 'IN_PROGRESS'), [feed]);

  // Prepare data for the chart (only graded items chronologically)
  const chartData = useMemo(() => {
    return feed
      .filter((item) => item.score !== null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((item, index) => ({
        name: `Task ${index + 1}`,
        score: item.score,
        title: item.title,
      }));
  }, [feed]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-sm bg-surface-container-lowest">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Overall Grade</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-4xl font-bold text-primary">{stats.overallGrade}%</p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-10 h-10 text-primary">
              <path
                className="stroke-current text-primary/20"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-current"
                strokeWidth="3"
                strokeDasharray={`${stats.overallGrade}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-sm bg-surface-container-lowest">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Completion Rate</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-4xl font-bold text-green-600">{stats.completionRate}%</p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-sm bg-surface-container-lowest">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Missing Tasks</p>
            <div className="flex items-end gap-2 mt-1">
              <p className={`text-4xl font-bold ${stats.totalMissing > 0 ? 'text-red-600' : 'text-on-surface'}`}>
                {stats.totalMissing}
              </p>
            </div>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stats.totalMissing > 0 ? 'bg-red-100 text-red-600' : 'bg-surface-container text-on-surface-variant'}`}>
            <AlertCircle className="w-7 h-7" />
          </div>
        </Card>
      </div>

      {/* 2. Progress Analytics Chart */}
      {chartData.length > 0 && (
        <Card className="p-6 rounded-2xl border border-outline-variant/30 shadow-sm bg-surface-container-lowest">
          <h3 className="text-lg font-bold text-on-surface mb-6">Performance Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant) / 0.3)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--on-surface-variant))' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--on-surface-variant))' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                  labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--on-surface))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--surface-container-lowest))' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 3. Task Tracker Feed */}
      <Card className="rounded-2xl border border-outline-variant/30 shadow-sm bg-surface-container-lowest overflow-hidden">
        <div className="flex border-b border-outline-variant/30 bg-surface-container/30">
          <button
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-2 ${
              activeTab === "todo" ? "border-primary text-primary bg-primary/5" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            onClick={() => setActiveTab("todo")}
          >
            To Do ({todoFeed.length})
          </button>
          <button
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-2 ${
              activeTab === "completed" ? "border-green-600 text-green-600 bg-green-50/50" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedFeed.length})
          </button>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {(activeTab === "todo" ? todoFeed : completedFeed).length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">All caught up!</h4>
                <p className="text-on-surface-variant mt-1">
                  {activeTab === "todo" ? "You have no pending assignments or assessments." : "You haven't completed any tasks yet."}
                </p>
              </div>
            </div>
          ) : (
            (activeTab === "todo" ? todoFeed : completedFeed).map((item) => (
              <div 
                key={item.id} 
                className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors ${
                  item.status === 'GRADED' || item.status === 'REVIEWED' ? 'cursor-pointer hover:bg-surface-container/30' : ''
                }`}
                onClick={() => {
                  if (item.status === 'GRADED' || item.status === 'REVIEWED') {
                    setSelectedItem(item);
                  }
                }}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'ASSIGNMENT' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'ASSIGNMENT' ? <FileText className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-on-surface text-base">{item.title}</h4>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.createdAt ? format(parseISO(item.createdAt), 'MMM d, yyyy') : 'No Date'}
                      </span>
                      {item.submittedAt && (
                        <span className="text-green-600 font-medium">
                          Submitted {format(parseISO(item.submittedAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 pl-16 sm:pl-0">
                  <div className="text-right">
                    {item.status === 'MISSING' && <span className="text-red-600 font-semibold text-sm">Missing</span>}
                    {item.status === 'PENDING' && <span className="text-blue-600 font-semibold text-sm">Under Review</span>}
                    {item.status === 'IN_PROGRESS' && <span className="text-yellow-600 font-semibold text-sm">In Progress</span>}
                    {item.status === 'REVIEWED' && (
                      <span className="text-green-600 font-semibold text-sm">
                        {typeof item.score === "number" ? `${item.score.toFixed(1)}%` : "Reviewed"}
                      </span>
                    )}
                    {item.status === 'GRADED' && (
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${item.score >= item.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                          {item.score?.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {(item.status === 'GRADED' || item.status === 'REVIEWED') && (
                    <div className="text-primary hidden sm:block opacity-50 hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 4. Feedback Viewer Modal */}
      {selectedItem && (
        <FeedbackViewer 
          isOpen={!!selectedItem} 
          onClose={() => setSelectedItem(null)} 
          item={selectedItem} 
        />
      )}
    </div>
  );
}
