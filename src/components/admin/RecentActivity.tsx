import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    createdAt: Date;
  }[];
}

export default function RecentActivity({ users }: RecentActivityProps) {
  // Format real users into "activities"
  const activities = users.map((user) => ({
    id: user.id,
    icon: "person_add",
    iconBg: "bg-primary-fixed",
    iconColor: "text-primary",
    message: (
      <>
        New {user.role.toLowerCase()}{" "}
        <strong>{user.name}</strong> joined the platform.
      </>
    ),
    time: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(user.createdAt)),
  }));

  return (
    <div className="bg-surface-container-lowest rounded-xl card-shadow-1 border border-surface-variant flex flex-col h-full">
      <div className="p-6 border-b border-surface-variant flex justify-between items-center">
        <h3 className="font-headline-md text-on-surface">Recent Users</h3>
        <Link
          href="/admin/users"
          className="text-secondary font-label-md hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="flex-1 divide-y divide-surface-variant">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-surface-container-low/50 transition-colors flex gap-4 items-start"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  activity.iconBg,
                  activity.iconColor
                )}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {activity.icon}
                </span>
              </div>
              <div>
                <p className="font-body-sm text-on-surface">{activity.message}</p>
                <p className="font-label-sm text-on-surface-variant mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-on-surface-variant font-body-sm">
            No recent activity.
          </div>
        )}
      </div>
    </div>
  );
}
