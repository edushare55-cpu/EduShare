"use client";

import React from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import StatCard from "@/components/admin/StatCard";
import PlatformActivityChart from "@/components/admin/PlatformActivityChart";
import RecentActivity from "@/components/admin/RecentActivity";

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) {
    return <div className="p-8 text-on-surface-variant font-body-lg">Loading analytics...</div>;
  }

  if (error || !analytics) {
    return <div className="p-8 text-error font-body-lg">Failed to load analytics data.</div>;
  }

  const { overview, recentUsers, monthlyActivity } = analytics;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Platform Analytics
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Deep dive into platform usage, student engagement, and resource distribution.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Users"
          value={overview.totalUsers.toLocaleString()}
          icon="group"
          iconBg="bg-primary-fixed"
          iconColor="text-primary"
        />
        <StatCard
          label="Active Sections"
          value={overview.activeClasses.toLocaleString()}
          icon="class"
          iconBg="bg-secondary-fixed"
          iconColor="text-secondary"
        />
        <StatCard
          label="Submission Rate"
          value={`${Math.round(overview.submissionRate)}%`}
          icon="assignment_turned_in"
          iconBg="bg-tertiary-fixed"
          iconColor="text-tertiary"
        />
        <StatCard
          label="Total Submissions"
          value={overview.totalSubmissions.toLocaleString()}
          icon="upload_file"
          iconBg="bg-primary-container"
          iconColor="text-primary"
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PlatformActivityChart data={monthlyActivity} />
        </div>
        <div>
          <RecentActivity users={recentUsers as any} />
        </div>
      </div>
    </div>
  );
}
