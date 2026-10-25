import React from "react";
import Link from "next/link";
import SectionCard from "./SectionCard";
import type { ClassSection } from "@/types";

interface MySectionsSectionProps {
  sections: (ClassSection & {
    _count?: { members: number; posts: number };
    unreadSubmissions?: number;
  })[];
}

export default function MySectionsSection({ sections }: MySectionsSectionProps) {
  const bandColors = ["primary", "secondary", "tertiary"] as const;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          My Sections
        </h3>
        <Link
          href="/faculty/classes"
          className="font-label-md text-label-md text-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          View All
          <span className="material-symbols-outlined text-[16px]">
            arrow_forward
          </span>
        </Link>
      </div>

      {sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, idx) => {
            const hasSubmissions = section.unreadSubmissions && section.unreadSubmissions > 0;
            return (
              <SectionCard
                key={section.id}
                id={section.id}
                sectionCode={section.classCode}
                sectionLabel={section.name}
                schedule={section.subject} // Using subject for schedule text in this mockup
                room="Virtual"
                studentCount={section._count?.members || 0}
                bandColor={bandColors[idx % bandColors.length]}
                status={{
                  icon: hasSubmissions ? "assignment_late" : "check_circle",
                  label: hasSubmissions ? `${section.unreadSubmissions} Ungraded` : "Up to date",
                  color: hasSubmissions ? "text-error" : "text-outline",
                  bg: hasSubmissions ? "bg-error-container/30" : undefined,
                }}
                href={`/faculty/classes/${section.id}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-on-surface-variant font-body-md border border-dashed border-outline-variant/50 rounded-xl">
          You don't have any active sections yet.
        </div>
      )}
    </section>
  );
}
