"use client";

import React, { useMemo } from "react";
import { Post } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StudentAnalyticsProps {
  posts: Post[];
}

export default function StudentAnalytics({ posts }: StudentAnalyticsProps) {
  // 1. Calculate Activity over the last 7 days
  const activityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateString: d.toISOString().split("T")[0],
        display: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: 0,
      };
    });

    posts.forEach((post) => {
      const postDate = new Date(post.createdAt).toISOString().split("T")[0];
      const dayData = last7Days.find((d) => d.dateString === postDate);
      if (dayData) {
        dayData.count++;
      }
    });

    return last7Days;
  }, [posts]);

  // 2. Calculate Post Breakdown
  const breakdownData = useMemo(() => {
    let assignments = 0;
    let materials = 0;
    let general = 0;

    posts.forEach((post) => {
      if (post.isSubmissionPost) assignments++;
      else if (post.files && post.files.length > 0) materials++;
      else general++;
    });

    return [
      { name: "Assignments", value: assignments, color: "#006A60" }, // Primary
      { name: "Materials", value: materials, color: "#4A635F" }, // Secondary
      { name: "General", value: general, color: "#77F8E5" }, // Tertiary
    ].filter((item) => item.value > 0);
  }, [posts]);

  // 3. Upcoming Deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return posts
      .filter((p) => p.isSubmissionPost && p.submissionDeadline && new Date(p.submissionDeadline) > now)
      .sort((a, b) => new Date(a.submissionDeadline!).getTime() - new Date(b.submissionDeadline!).getTime())
      .slice(0, 3);
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">analytics</span>
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">No Class Activity Yet</h3>
        <p className="text-on-surface-variant max-w-md">
          Your analytics dashboard will automatically populate with beautiful insights once your professors start posting materials and assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* Activity Graph */}
      <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col">
        <h3 className="font-headline-md text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">insights</span>
          7-Day Activity Trend
        </h3>
        <div className="h-[250px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }} dy={10} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }} />
              <RechartsTooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", backgroundColor: "var(--surface-container-highest)" }}
                itemStyle={{ color: "var(--on-surface)" }}
                labelStyle={{ color: "var(--on-surface-variant)", fontWeight: "bold", marginBottom: "4px" }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Breakdown Chart */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
          <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">pie_chart</span>
            Resource Breakdown
          </h3>
          <div className="h-[180px] w-full flex-1 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  itemStyle={{ color: "#333", fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {breakdownData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
