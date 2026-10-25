import React, { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SectionCardProps {
  sectionCode: string        // e.g. "C1", "C2", "C3"
  sectionLabel: string       // e.g. "Section C1"
  schedule: string           // e.g. "MWF 7:30 – 9:00 AM"
  room: string               // e.g. "Room 204"
  studentCount: number
  bandColor: "primary" | "secondary" | "tertiary"
  status: {
    icon: string
    label: string
    color: string
    bg?: string
  }
  href: string
  id: string
  isArchived?: boolean
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function SectionCard({
  sectionCode,
  sectionLabel,
  schedule,
  room,
  studentCount,
  bandColor,
  status,
  href,
  id,
  isArchived = false,
  onArchive,
  onRestore,
  onDelete,
}: SectionCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const bandBg =
    bandColor === "primary"
      ? "bg-primary"
      : bandColor === "secondary"
      ? "bg-secondary"
      : "bg-tertiary";

  const bandText =
    bandColor === "primary"
      ? "text-on-primary"
      : bandColor === "secondary"
      ? "text-on-secondary"
      : "text-on-tertiary";

  return (
    <div
      className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 hover:shadow-[0_8px_20px_rgba(0,35,111,0.08)] transition-all duration-300 relative overflow-hidden group flex flex-col h-[280px]"
    >
      <Link href={href} className="absolute inset-0 z-0" />
      <div className={`relative z-10 h-2 w-full ${bandBg}`} />

      <div className="relative z-10 p-md flex-1 flex flex-col pt-lg pointer-events-none">
        <div className="flex justify-between items-start mb-sm pointer-events-auto">
          <span
            className={`${bandBg} ${bandText} px-3 py-1 rounded-full font-label-sm text-label-sm`}
          >
            {sectionLabel}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="text-outline hover:text-primary p-1 rounded-full hover:bg-surface-container-high transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface border-outline-variant/30 rounded-xl shadow-lg">
              {!isArchived && onArchive && (
                <DropdownMenuItem 
                  onClick={(e) => { e.preventDefault(); onArchive(id); }}
                  className="cursor-pointer text-on-surface hover:bg-surface-container py-2.5 rounded-lg"
                >
                  <span className="material-symbols-outlined mr-3 text-[18px]">archive</span>
                  Archive Section
                </DropdownMenuItem>
              )}
              {isArchived && onRestore && (
                <DropdownMenuItem 
                  onClick={(e) => { e.preventDefault(); onRestore(id); }}
                  className="cursor-pointer text-on-surface hover:bg-surface-container py-2.5 rounded-lg"
                >
                  <span className="material-symbols-outlined mr-3 text-[18px]">unarchive</span>
                  Restore Section
                </DropdownMenuItem>
              )}
              {isArchived && onDelete && (
                <DropdownMenuItem 
                  onSelect={(e) => { e.preventDefault(); setShowDeleteAlert(true); }}
                  className="cursor-pointer text-error focus:bg-error-container/20 focus:text-error hover:bg-error-container/20 hover:text-error py-2.5 rounded-lg mt-1"
                >
                  <span className="material-symbols-outlined mr-3 text-[18px]">delete_forever</span>
                  Delete Permanently
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent 
              className="max-w-md bg-surface border border-outline-variant/30 rounded-2xl z-50"
              onClick={(e) => e.preventDefault()} // Prevent clicking through to the Link
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold text-error">Delete Section Permanently?</AlertDialogTitle>
                <AlertDialogDescription className="text-on-surface-variant">
                  This action cannot be undone. This will permanently delete the section <strong>{sectionLabel}</strong> and remove all associated data, posts, and student submissions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-outline-variant/50 hover:bg-surface-container text-on-surface">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => {
                  e.preventDefault();
                  if (onDelete) onDelete(id);
                  setShowDeleteAlert(false);
                }} className="bg-error hover:bg-error/90 text-white rounded-lg">
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <h4 className="font-headline-md text-headline-md text-on-surface mb-xs group-hover:text-secondary transition-colors line-clamp-2">
          Introduction to Computing
        </h4>

        <div className="flex flex-col gap-xs mb-md flex-1 mt-2">
          <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {schedule}
          </div>
          <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">meeting_room</span>
            {room}
          </div>
        </div>

        <div className="border-t border-outline-variant/20 pt-sm mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">group</span>
            {studentCount}
          </div>

          <div
            className={`flex items-center gap-1 font-label-sm text-label-sm ${status.color} ${status.bg ? `${status.bg} px-2 py-0.5 rounded-full` : ""}`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {status.icon}
            </span>
            {status.label}
          </div>
        </div>
      </div>
    </div>
  );
}
