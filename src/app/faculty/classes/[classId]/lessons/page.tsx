"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Video, BookOpen, AlertTriangle, GraduationCap } from "lucide-react";
import { useLessons, useCreateLesson } from "@/hooks/use-lessons";
import { useAssessmentQuestions, useCreateAssessment, useUpdateAssessment } from "@/hooks/use-assessments";
import { useFileUpload } from "@/hooks/use-file-upload";
import { LessonCard } from "@/components/faculty/LessonCard";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Skeleton } from "@/components/ui/skeleton";
import AssessmentBuilder from "@/components/faculty/AssessmentBuilder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Lesson } from "@/types";
import { toast } from "sonner";

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function CreateLessonModal({
  classId,
  open,
  onClose,
  onSuccess,
}: {
  classId: string;
  open:    boolean;
  onClose: () => void;
  onSuccess: (lesson: Lesson) => void;
}) {
  const [step,           setStep]           = useState<1 | 2>(1);
  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [isPublished,    setIsPublished]    = useState(false);
  const [videoFile,      setVideoFile]      = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration,  setVideoDuration]  = useState(0);
  
  const { upload, isUploading, progress, uploadState, error: uploadError, reset: resetUpload } = useFileUpload({
    bucket: "lesson-videos",
    folder: classId,
    maxSizeMB: 5000,
  });

  const { mutate: createLesson, isPending: isCreating } = useCreateLesson(classId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5GB.");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  const handleVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setVideoDuration(Math.floor(e.currentTarget.duration));
  };

  const handleCreate = async () => {
    if (!videoFile || !title.trim()) return;

    const uploadResult = await upload(videoFile);
    if (!uploadResult) {
      toast.error(uploadError || "Upload failed.");
      return;
    }

    try {
      const currentLessons = await fetch(`/api/lessons?classId=${classId}`).then((r) => r.json());
      const nextOrder = (currentLessons.data?.length ?? 0) + 1;

      createLesson(
        {
          classId,
          title:         title.trim(),
          description:   description.trim() || undefined,
          order:         nextOrder,
          videoUrl:      uploadResult.url,
          videoKey:      uploadResult.path,
          videoDuration,
          isPublished,
        },
        {
          onSuccess: (newLesson) => {
            onClose();
            resetForm();
            resetUpload();
            if (newLesson) {
              onSuccess(newLesson);
            }
          },
        }
      );
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save lesson.");
    }
  };

  const resetForm = () => {
    setStep(1); setTitle(""); setDescription("");
    setIsPublished(false); setVideoFile(null);
    setVideoPreviewUrl(null); setVideoDuration(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!o) { 
        if (isUploading || uploadState === "finalizing") {
          toast.warning("Please wait for the upload to finish before closing.");
          return;
        }
        onClose(); resetForm(); resetUpload(); 
      } 
    }}>
      <DialogContent className="sm:max-w-[600px] bg-surface-container-lowest">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-on-surface">
            <Video className="w-5 h-5 text-primary" />
            Add New Lesson
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1: Video upload */}
          {!videoFile ? (
            <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl
                               border-2 border-dashed border-outline-variant/50 hover:border-primary
                               cursor-pointer transition-colors bg-surface-container-low group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center
                              group-hover:bg-primary/20 transition-colors">
                <Video className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-on-surface">Click to upload video</p>
                <p className="text-xs text-on-surface-variant mt-1">MP4, WebM, MOV · Max 5GB</p>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          ) : (
            <>
              {/* Video preview */}
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  src={videoPreviewUrl!}
                  onLoadedMetadata={handleVideoLoaded}
                  controls
                  className="w-full h-full"
                />
              </div>

              {/* Details form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Lesson Title *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Introduction to Networking"
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                               bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will students learn in this lesson?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                               bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsPublished(!isPublished)}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center ${isPublished ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${isPublished ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-on-surface">Publish immediately</span>
                </label>
              </div>

              {/* Upload Progress UI */}
              {uploadState !== "idle" && (
                <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-on-surface">
                      {uploadState === "uploading" && "Uploading video... Please do not close this window."}
                      {uploadState === "finalizing" && "Finalizing upload..."}
                      {uploadState === "complete" && "Upload Complete!"}
                      {uploadState === "error" && "Upload Failed."}
                    </span>
                    {uploadState !== "error" && <span className="text-sm font-bold text-primary">{progress}%</span>}
                  </div>
                  
                  {uploadState !== "error" && (
                    <div className="w-full bg-outline-variant/30 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${uploadState === 'complete' ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}

                  {uploadState === "error" && uploadError && (
                    <p className="text-xs text-error mt-1">{uploadError}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); resetUpload(); }} disabled={isUploading}>
                  Change video
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isUploading || isCreating || !title.trim()}
                  className="bg-primary text-on-primary hover:opacity-90 min-w-[120px]"
                >
                  {isUploading ? "Uploading..." : isCreating ? "Saving..." : "Create Lesson"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assessment Panel ─────────────────────────────────────────────────────────

function AssessmentPanel({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const [showSettingsForm, setShowSettingsForm] = useState(!lesson.assessment);

  const { data: questions = [] } = useAssessmentQuestions(lesson.assessment?.id ?? "");
  const { mutate: createAssessment, isPending: isCreatingAssessment } = useCreateAssessment(lesson.id);
  const { mutate: updateAssessment, isPending: isUpdatingAssessment } = useUpdateAssessment(lesson.assessment?.id ?? "");

  const [title,         setTitle]         = useState(lesson.assessment?.title ?? "");
  const [passingScore,  setPassingScore]  = useState(lesson.assessment?.passingScore ?? 75);
  const [maxAttempts,   setMaxAttempts]   = useState(lesson.assessment?.maxAttempts ?? 3);
  const [timeLimitMins, setTimeLimitMins] = useState<string>(String(lesson.assessment?.timeLimitMins ?? ""));
  const [shuffleQuestions, setShuffleQuestions] = useState(lesson.assessment?.shuffleQuestions ?? false);

  const handleSaveSettings = () => {
    const data = {
      title:        title.trim(),
      passingScore,
      maxAttempts,
      timeLimitMins: timeLimitMins ? Number(timeLimitMins) : null,
      shuffleQuestions,
    };
    if (lesson.assessment) {
      updateAssessment(data, { onSuccess: () => setShowSettingsForm(false) });
    } else {
      createAssessment(
        { lessonId: lesson.id, ...data },
        { onSuccess: () => setShowSettingsForm(false) }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          {lesson.assessment ? "Edit Assessment" : "Create Assessment"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>Back to list</Button>
      </div>

      {/* Settings */}
      {showSettingsForm ? (
        <div className="space-y-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Assessment Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Module 1 Quiz"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                         bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Passing Score %</label>
              <input type="number" min={1} max={100} value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                           bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Max Attempts</label>
              <input type="number" min={0} max={10} value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                           bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Time Limit (min)</label>
              <input type="number" min={1} max={180} value={timeLimitMins}
                onChange={(e) => setTimeLimitMins(e.target.value)}
                placeholder="None"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                           bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <div
              onClick={() => setShuffleQuestions(!shuffleQuestions)}
              className={`w-10 h-5 rounded-full transition-colors flex items-center ${shuffleQuestions ? "bg-primary" : "bg-outline-variant"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${shuffleQuestions ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <span className="text-sm text-on-surface font-medium">Shuffle Questions & Choices on Retake</span>
          </label>
          
          <div className="flex justify-end gap-2 pt-1">
            {lesson.assessment && (
              <Button variant="ghost" onClick={() => setShowSettingsForm(false)}>Cancel</Button>
            )}
            <LoadingButton
              onClick={handleSaveSettings}
              disabled={!title.trim()}
              isLoading={isCreatingAssessment || isUpdatingAssessment}
              loadingText="Saving..."
              variant="primary"
            >
              Save Settings
            </LoadingButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div>
            <p className="text-sm font-semibold text-primary">{lesson.assessment?.title}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Pass: {lesson.assessment?.passingScore}% · Attempts: {lesson.assessment?.maxAttempts === 0 ? "Unlimited" : lesson.assessment?.maxAttempts} · Time: {lesson.assessment?.timeLimitMins ? `${lesson.assessment.timeLimitMins}min` : "No limit"} · Shuffle: {lesson.assessment?.shuffleQuestions ? "On" : "Off"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSettingsForm(true)}>
            Edit settings
          </Button>
        </div>
      )}

      {/* Questions */}
      {lesson.assessment && !showSettingsForm && (
        <AssessmentBuilder
          assessmentId={lesson.assessment.id}
          questions={questions}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FacultyLessonsPage() {
  const params    = useParams();
  const router    = useRouter();
  const classId   = params.classId as string;

  const { data: lessons = [], isLoading, isError } = useLessons(classId);
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [selectedLesson,  setSelectedLesson]   = useState<Lesson | null>(null);
  const [panelMode,       setPanelMode]        = useState<"assessment" | null>(null);

  const typedLessons = lessons as Lesson[];

  // Keep selectedLesson in sync with the real-time cache
  useEffect(() => {
    if (selectedLesson) {
      const updated = typedLessons.find((l) => l.id === selectedLesson.id);
      if (updated && JSON.stringify(updated.assessment) !== JSON.stringify(selectedLesson.assessment)) {
        setSelectedLesson(updated);
      }
    }
  }, [typedLessons, selectedLesson]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <AlertTriangle className="w-12 h-12 mb-4 text-error" />
          <p className="font-semibold">Failed to load lessons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Video Lessons</h2>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {typedLessons.length} lesson{typedLessons.length !== 1 ? "s" : ""} · Sequential order
          </p>
        </div>
        {!panelMode && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-on-primary hover:opacity-90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </Button>
        )}
      </div>

      {/* Assessment panel */}
      {panelMode === "assessment" && selectedLesson && (
        <div className="mb-6 p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          <AssessmentPanel
            lesson={selectedLesson}
            onClose={() => { setPanelMode(null); setSelectedLesson(null); }}
          />
        </div>
      )}

      {/* Lesson list */}
      {typedLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant
                        border-2 border-dashed border-outline-variant/30 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-on-surface mb-1">No lessons yet</h3>
          <p className="text-sm text-center max-w-xs">
            Add your first video lesson to get started. Students watch in order and unlock assessments.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-5 bg-primary text-on-primary hover:opacity-90 gap-2"
          >
            <Plus className="w-4 h-4" /> Add First Lesson
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {typedLessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              classId={classId}
              isFirst={index === 0}
              isLast={index === typedLessons.length - 1}
              onEdit={(l) => toast.info("Edit details coming soon")}
              onManageAssessment={(l) => {
                setSelectedLesson(l);
                setPanelMode("assessment");
              }}
              onViewSubmissions={(l) => {
                router.push(`/faculty/classes/${classId}/lessons/${l.id}/submissions`);
              }}
            />
          ))}
        </div>
      )}

      <CreateLessonModal
        classId={classId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newLesson) => {
          setSelectedLesson(newLesson);
          setPanelMode("assessment");
        }}
      />
    </div>
  );
}
