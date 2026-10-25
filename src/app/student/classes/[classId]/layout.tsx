"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useClass } from "@/hooks/use-class";
import { usePosts } from "@/hooks/use-posts";
import {
  useNotifications,
  useMarkNotificationsRead,
} from "@/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  Users,
  ArrowLeft,
  Video,
  ClipboardList,
  BookOpen,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudentClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const classId = params.classId as string;

  const { data: classData, isLoading } = useClass(classId);
  const { data: posts } = usePosts(classId);
  const { data: notifData } = useNotifications(true);
  const { mutate: markAsRead } = useMarkNotificationsRead();

  // Filter unread alerts by matching their referenceId against the posts in this class
  const classPostIds = new Set(posts?.map((p) => p.id) || []);
  const unreadAlerts = notifData?.notifications || [];
  const classUnreadAlerts = unreadAlerts.filter(
    (n) => n.referenceId && classPostIds.has(n.referenceId),
  );

  const feedUnreadAlerts = classUnreadAlerts.filter(
    (n) => n.type === "NEW_POST",
  );
  const assignmentUnreadAlerts = classUnreadAlerts.filter(
    (n) => n.type === "NEW_ASSIGNMENT",
  );

  const feedUnreadIds = feedUnreadAlerts.map((n) => n.id).join(",");
  const assignmentUnreadIds = assignmentUnreadAlerts.map((n) => n.id).join(",");

  React.useEffect(() => {
    if (pathname.includes("/feed") && feedUnreadAlerts.length > 0) {
      markAsRead(feedUnreadAlerts.map((n) => n.id));
    }
    if (
      pathname.includes("/assignments") &&
      assignmentUnreadAlerts.length > 0
    ) {
      markAsRead(assignmentUnreadAlerts.map((n) => n.id));
    }
  }, [pathname, feedUnreadIds, assignmentUnreadIds, markAsRead]);

  const tabs = [
    {
      label: "Announcements",
      href: `/student/classes/${classId}/feed`,
      icon: Megaphone,
      badgeCount: feedUnreadAlerts.length,
    },
    {
      label: "Lessons",
      href: `/student/classes/${classId}/lessons`,
      icon: Video,
    },
    {
      label: "Syllabus",
      href: `/student/classes/${classId}/syllabus`,
      icon: BookOpen,
    },
    {
      label: "Attendance",
      href: `/student/classes/${classId}/attendance`,
      icon: CalendarCheck2,
    },
    {
      label: "Assignments",
      href: `/student/classes/${classId}/assignments`,
      icon: ClipboardList,
      badgeCount: assignmentUnreadAlerts.length,
    },
    {
      label: "Grades",
      href: `/student/classes/${classId}/submissions`,
      icon: BookOpen,
    },
    {
      label: "Student Information Sheet",
      href: `/student/classes/${classId}/members`,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Header */}
      <header className="bg-surface pt-6">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8">
          <Link href="/student/classes">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Sections
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-64 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </>
              ) : !classData ? (
                <h1 className="text-3xl font-bold text-on-surface">
                  Class Overview
                </h1>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-on-surface tracking-tight">
                    {classData.name}
                  </h1>
                  <p className="text-on-surface-variant text-base flex items-center gap-2 mt-1 font-medium">
                    <span className="material-symbols-outlined text-[18px]">
                      subject
                    </span>
                    {classData.subject}
                    {classData.faculty && (
                      <>
                        {" · "}
                        <span className="text-sm text-on-surface-variant">
                          {classData.faculty.name}
                        </span>
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - STICKY */}
      <div className="sticky top-16 z-30 bg-surface border-b border-outline-variant/30">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8">
          <nav className="flex gap-2 overflow-x-auto no-scrollbar border-b border-transparent">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {!!tab.badgeCount && (
                    <Badge
                      variant="destructive"
                      className="ml-1 h-5 min-w-5 flex items-center justify-center px-1 text-[10px]"
                    >
                      {tab.badgeCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-surface">{children}</main>
    </div>
  );
}
