"use client";

import React, { useState, useMemo } from "react";
import SectionCard from "@/components/faculty/SectionCard";
import { useClasses } from "@/hooks/use-class";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type BandColor = "primary" | "secondary" | "tertiary";

export default function FacultyClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const { data: classes = [], isLoading } = useClasses();
  const qc = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: (classId: string) => apiClient.patch(`/api/classes/${classId}`, { isArchived: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Section archived.");
    }
  });
  
  const restoreMutation = useMutation({
    mutationFn: (classId: string) => apiClient.patch(`/api/classes/${classId}`, { isArchived: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Section restored.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (classId: string) => apiClient.delete(`/api/classes/${classId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Section permanently deleted.");
    }
  });

  const filteredSections = useMemo(() => {
    return classes.filter((section) => {
      const matchesSearch =
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isArchivedStatus = activeTab === "archived";
      return matchesSearch && section.isArchived === isArchivedStatus;
    });
  }, [searchQuery, classes, activeTab]);

  const bandColors: BandColor[] = ["primary", "secondary", "tertiary"];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
            My Sections
          </h1>
          <p className="text-on-surface-variant text-lg">
            Manage your classes, schedules, and students.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest/60 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-96 flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by section, code, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container pl-12 pr-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-lg"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")} className="w-full sm:w-[300px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex flex-col h-[280px]">
              <Skeleton className="h-2 w-full rounded-none rounded-t-xl" />
              <div className="p-4 flex-1 flex flex-col pt-6">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4 mb-1 mt-2" />
                
                <div className="flex flex-col gap-2 mb-4 flex-1 mt-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                
                <div className="border-t border-outline-variant/20 pt-4 mt-auto flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSections.map((section, idx) => (
            <SectionCard
              key={section.id}
              id={section.id}
              sectionCode={section.classCode}
              sectionLabel={section.name}
              schedule={section.subject}
              room="Virtual"
              studentCount={section._count?.members || 0}
              bandColor={bandColors[idx % bandColors.length]}
              status={{
                icon: section.isArchived ? "archive" : "check_circle",
                label: section.isArchived ? "Archived" : "Active",
                color: section.isArchived ? "text-error" : "text-outline",
              }}
              href={`/faculty/classes/${section.id}/feed`}
              isArchived={section.isArchived}
              onArchive={archiveMutation.mutate}
              onRestore={restoreMutation.mutate}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest/30 rounded-2xl border border-outline-variant/20 border-dashed">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">
            {activeTab === "archived" ? "inventory_2" : "search_off"}
          </span>
          <h3 className="text-xl font-bold text-on-surface mb-2">
            No sections found
          </h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {activeTab === "archived" 
              ? "You don't have any archived sections."
              : "You don't have any sections matching your search, or you haven't created any yet."}
          </p>
        </div>
      )}
    </div>
  );
}
