"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ExtendedClass {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  classCode: string;
  isArchived: boolean;
  faculty?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  memberCount?: number;
}

interface ClassCardProps {
  classData: ExtendedClass | any;
}

export function ClassCard({ classData }: ClassCardProps) {
  const initials = classData.faculty?.name 
    ? classData.faculty.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "FA";

  return (
    <Link href={`/student/classes/${classData.id}/feed`} className="block h-full group">
      <div className="flex flex-col h-full bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
        
        {/* Banner area */}
        <div className="h-24 bg-gradient-to-r from-primary/80 to-secondary/80 relative">
          {classData.isArchived && (
            <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface-variant text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">archive</span>
              Archived
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 p-5 relative flex flex-col">
          {/* Faculty Avatar overlapping the banner */}
          <div className="absolute -top-8 left-5 border-4 border-surface-container-lowest rounded-full bg-surface-container-lowest">
            <Avatar className="h-12 w-12">
              <AvatarImage src={classData.faculty?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary-container text-on-primary-container font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-6 flex flex-col flex-1">
            <h3 className="font-bold text-lg text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
              {classData.name}
            </h3>
            <p className="text-sm text-on-surface-variant font-medium mt-1">
              {classData.subject}
            </p>
            <p className="text-sm text-on-surface-variant/80 mt-2 line-clamp-2">
              {classData.description || "No description provided."}
            </p>

            <div className="mt-auto pt-6 flex items-center justify-between border-t border-outline-variant/20">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Instructor
                </span>
                <span className="text-sm font-medium text-on-surface line-clamp-1">
                  {classData.faculty?.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span className="text-xs font-semibold">{classData.memberCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
