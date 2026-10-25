"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface AdminDashboardAnalyticsProps {
  monthlyActivity: { date: string; post_count: number }[];
  userDemographics: { role: string; count: number }[];
  reportHealth: { status: string; count: number }[];
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "#f97316", // orange
  FACULTY: "#0058be", // primary blue
  ADMIN: "#10b981",   // emerald
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#facc15",   // yellow
  RESOLVED: "#10b981",  // emerald
  DISMISSED: "#94a3b8", // slate
};

export default function AdminDashboardAnalytics({
  monthlyActivity,
  userDemographics,
  reportHealth,
}: AdminDashboardAnalyticsProps) {
  const [activeRange, setActiveRange] = useState<"30D" | "90D" | "1Y">("30D");

  // Format Line Chart Data
  const activityData = monthlyActivity.map((d) => {
    const dateObj = new Date(d.date);
    return {
      day: `${dateObj.toLocaleString("default", { month: "short" })} ${dateObj.getDate()}`,
      uploads: d.post_count,
      users: Math.floor(d.post_count * 1.5), // Mock active users based on uploads for visualization
    };
  });

  // Format Pie Chart Data
  const demoData = userDemographics.map((u) => ({
    name: u.role.charAt(0) + u.role.slice(1).toLowerCase(),
    value: u.count,
    color: ROLE_COLORS[u.role] || "#94a3b8",
  }));

  // Format Bar Chart Data (Reports)
  const reportData = reportHealth.map((r) => ({
    name: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
    count: r.count,
    color: STATUS_COLORS[r.status] || "#94a3b8",
  }));

  // Custom Tooltips
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-outline-variant/30 p-3 rounded-lg shadow-md">
          <p className="font-semibold text-on-surface">{`${payload[0].name}`}</p>
          <p className="text-primary font-medium">{`${payload[0].value} Users`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-outline-variant/30 p-3 rounded-lg shadow-md">
          <p className="font-semibold text-on-surface">{`${payload[0].payload.name}`}</p>
          <p className="text-error font-medium">{`${payload[0].value} Reports`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 animate-in fade-in duration-700">
      {/* Platform Activity Line Chart */}
      <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl card-shadow-1 border border-surface-variant p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="font-headline-md text-on-surface">Platform Activity</h3>
            <p className="font-body-sm text-on-surface-variant mt-1">
              User engagement and resource uploads over time.
            </p>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-lg">
            {["30D", "90D", "1Y"].map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range as any)}
                className={cn(
                  "px-3 py-1 font-label-sm rounded-md transition-all",
                  activeRange === range
                    ? "bg-surface-container-lowest shadow-sm text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full min-h-[250px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#444651", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: "#444651", fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
              <RechartsTooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e0e3e5", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)" }}
                itemStyle={{ fontSize: "14px", fontWeight: 500 }}
                labelStyle={{ fontSize: "12px", color: "#444651", marginBottom: "4px" }}
              />
              <Line type="monotone" dataKey="users" name="Active Users" stroke="#0058be" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#0058be", stroke: "#ffffff", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="uploads" name="Resource Uploads" stroke="#adc6ff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#adc6ff", stroke: "#ffffff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary" />
            <span className="font-label-sm text-on-surface-variant">Active Users</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
            <span className="font-label-sm text-on-surface-variant">Resource Uploads</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 flex flex-col gap-8">
        {/* User Demographics Doughnut Chart */}
        <div className="bg-surface-container-lowest rounded-xl card-shadow-1 border border-surface-variant p-6 flex-1 flex flex-col">
          <div className="mb-2">
            <h3 className="font-headline-md text-on-surface">User Demographics</h3>
          </div>
          <div className="flex-1 min-h-[180px] w-full relative min-w-0">
            {demoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={demoData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                    {demoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/60">
                <p>No user data.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Reports Bar Chart */}
        <div className="bg-surface-container-lowest rounded-xl card-shadow-1 border border-surface-variant p-6 flex-1 flex flex-col">
          <div className="mb-2">
            <h3 className="font-headline-md text-on-surface">System Reports Health</h3>
          </div>
          <div className="flex-1 min-h-[180px] w-full min-w-0">
            {reportData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e3e5" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#444651" }} width={70} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomBarTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/60">
                <p>No reports found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
