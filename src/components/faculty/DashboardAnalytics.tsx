"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

interface DashboardAnalyticsProps {
  submissionsStatus: { status: string; count: number }[];
  sectionsEngagement: { name: string; studentCount: number; postCount: number }[];
  recentActivity: { month: string; submissions: number }[];
}

// Modern, vibrant color palette for charts
const COLORS = ["#0058be", "#f97316", "#10b981", "#8b5cf6", "#ec4899"];

export default function DashboardAnalytics({
  submissionsStatus,
  sectionsEngagement,
  recentActivity,
}: DashboardAnalyticsProps) {
  // Map raw status enum to readable labels and assign a color
  const statusData = submissionsStatus.map((item, index) => ({
    name:
      item.status === "PENDING"
        ? "Pending Review"
        : item.status === "SUBMITTED"
        ? "Submitted"
        : "Reviewed",
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  // Custom Tooltip for PieChart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5">
          <p className="font-bold text-on-surface mb-1 tracking-tight">{`${payload[0].name}`}</p>
          <p className="font-black text-lg" style={{ color: payload[0].payload.color }}>{`${payload[0].value} Submissions`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for BarChart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5">
          <p className="font-bold text-on-surface mb-2 tracking-tight">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-sm font-semibold text-on-surface-variant">
                {entry.name}: <span className="font-black text-on-surface">{entry.value}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-700">
      
      {/* 1. Engagement Timeline */}
      <Card className="xl:col-span-2 bg-surface-container-lowest/80 backdrop-blur-xl border-outline-variant/30 shadow-sm hover:shadow-lg transition-shadow duration-500 p-6 rounded-3xl overflow-hidden">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">timeline</span>
          <h3 className="font-headline-md text-on-surface text-lg">Activity Timeline</h3>
        </div>
        <div className="h-[300px] w-full">
          {recentActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0058be" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip content={<CustomBarTooltip />} />
                <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#0058be" fillOpacity={1} fill="url(#colorSubmissions)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/60">
              <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
              <p>Not enough data to display timeline.</p>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Submission Status Breakdown */}
      <Card className="bg-surface-container-lowest/80 backdrop-blur-xl border-outline-variant/30 shadow-sm hover:shadow-lg transition-shadow duration-500 p-6 rounded-3xl overflow-hidden flex flex-col">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">pie_chart</span>
          <h3 className="font-headline-md text-on-surface text-lg">Submission Status</h3>
        </div>
        <div className="h-[240px] w-full flex-1 relative">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/60">
              <p>No submissions recorded yet.</p>
            </div>
          )}
        </div>
      </Card>

      {/* 3. Class Engagement Overview */}
      <Card className="xl:col-span-3 bg-surface-container-lowest/80 backdrop-blur-xl border-outline-variant/30 shadow-sm hover:shadow-lg transition-shadow duration-500 p-6 rounded-3xl overflow-hidden">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">analytics</span>
          <h3 className="font-headline-md text-on-surface text-lg">Class Performance Overview</h3>
        </div>
        <div className="h-[350px] w-full">
          {sectionsEngagement.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionsEngagement} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="studentCount" name="Enrolled Students" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar yAxisId="right" dataKey="postCount" name="Active Posts" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/60">
              <span className="material-symbols-outlined text-4xl mb-2">stacked_bar_chart</span>
              <p>No active sections to display.</p>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
