"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassSection } from "@/types";
import ClassmatesModal from "./ClassmatesModal";

interface MySectionProps {
  classData: ClassSection;
}

export default function MySection({ classData }: MySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
    <div 
      onClick={() => router.push(`/student/classes/${classData.id}/feed`)}
      className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 hover:shadow-[0_8px_20px_rgba(0,35,111,0.08)] hover:border-primary/40 transition-all duration-300 relative overflow-hidden cursor-pointer group"
    >
      <div className="h-2 w-full bg-primary absolute top-0 left-0" />

      <div className="p-md pt-lg flex flex-col md:flex-row gap-md items-center justify-between">
        <div className="flex-1 flex flex-col gap-sm">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm">
              {classData.classCode}
            </span>
            <span className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
              {classData.name}
            </span>
          </div>

          <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">person</span>
            Prof. {classData.faculty?.name || "Faculty"}
          </div>

          <div className="flex flex-wrap gap-md">
            <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">subject</span>
              {classData.subject}
            </div>
            {classData._count && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 font-label-sm text-sm text-primary bg-primary/5 hover:bg-primary/15 px-3 py-1 rounded-md transition-colors hover-group cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] hover-group-hover:scale-110 transition-transform">group</span>
                {classData._count?.members ?? 0} Classmates
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    
    <ClassmatesModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      classId={classData.id} 
      className={classData.name} 
    />
    </>
  );
}
