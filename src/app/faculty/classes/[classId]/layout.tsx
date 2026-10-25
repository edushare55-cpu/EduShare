"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useClass } from "@/hooks/use-class";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  FileText,
  Users,
  ArrowLeft,
  Video,
  BookOpen,
  ClipboardList,
  CalendarCheck2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const classId = params.classId as string;

  const { data: classData, isLoading, isError } = useClass(classId);

  const tabs = [
    {
      label: "Announcements",
      href: `/faculty/classes/${classId}/feed`,
      icon: Megaphone,
    },
    {
      label: "Lessons",
      href: `/faculty/classes/${classId}/lessons`,
      icon: Video,
    },
    {
      label: "Syllabus",
      href: `/faculty/classes/${classId}/syllabus`,
      icon: BookOpen,
    },
    {
      label: "Attendance",
      href: `/faculty/classes/${classId}/attendance`,
      icon: CalendarCheck2,
    },
    {
      label: "Assignments",
      href: `/faculty/classes/${classId}/assignments`,
      icon: ClipboardList,
    },
    {
      label: "Submissions",
      href: `/faculty/classes/${classId}/submissions`,
      icon: FileText,
    },
    {
      label: "Grading System",
      href: `/faculty/classes/${classId}/gradebook`,
      icon: ClipboardList,
    },
    {
      label: "Student Information Sheet",
      href: `/faculty/classes/${classId}/members`,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Header / Hero */}
      <header className="bg-surface pt-6">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8">
          <Link href="/faculty/classes">
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
              ) : isError || !classData ? (
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
                    {classData.subject} • Code:{" "}
                    <span className="bg-surface-container px-2 py-0.5 rounded text-sm">
                      {classData.classCode}
                    </span>
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
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-surface">{children}</main>
    </div>
  );
}
