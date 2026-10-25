"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { usePosts, useCreatePost } from "@/hooks/use-posts";
import { useFileUpload } from "@/hooks/use-file-upload";
import PostCard from "@/components/shared/PostCard";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/shared/LoadingButton";

function CreateAssignmentForm({ classId, onCancel }: { classId: string, onCancel: () => void }) {
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, isUploading } = useFileUpload({ bucket: "post-files" });
  const { mutate: createPost, isPending } = useCreatePost();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await upload(file);
      if (result) {
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileUrl: result.url,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
          },
        ]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter assignment instructions.");
      return;
    }
    if (!deadline) {
      toast.error("Please set a deadline.");
      return;
    }
    if (isUploading) return;

    createPost(
      {
        classId,
        content,
        isSubmissionPost: true,
        submissionDeadline: new Date(deadline).toISOString(),
        files: attachments,
      },
      {
        onSuccess: () => {
          setContent("");
          setDeadline("");
          setAttachments([]);
          toast.success("Assignment created successfully");
          onCancel();
        },
      }
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/30">
        <h3 className="font-bold text-on-surface text-lg">Create New Assignment</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
          <X className="w-5 h-5" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-6">
        <div className="space-y-2">
          <label className="font-label-md text-on-surface">Instructions</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the assignment..."
            rows={4}
            className="w-full bg-surface-container p-4 rounded-xl resize-none outline-none focus:ring-2 focus:ring-primary/50 font-body-md text-on-surface placeholder:text-on-surface-variant/70 transition-all border border-outline-variant/50"
            required
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="font-label-md text-on-surface">Submission Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-surface-container px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-on-surface border border-outline-variant/50 font-body-md"
              required
            />
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="font-label-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
              Attach Files (Optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              disabled={isUploading}
              className="hidden"
              id="assignment-file-upload"
            />
            <label
              htmlFor="assignment-file-upload"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-lg text-on-surface-variant hover:text-primary cursor-pointer transition-colors bg-surface-container/30"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isUploading ? "sync" : "upload_file"}
              </span>
              <span className="font-label-md">{isUploading ? "Uploading..." : "Browse Files"}</span>
            </label>
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-primary-container/30 text-primary px-3 py-1.5 rounded-lg text-sm border border-primary/20">
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span className="truncate max-w-[150px]">{file.fileName}</span>
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="hover:text-error ml-1 flex items-center"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-outline-variant/30">
          <LoadingButton
            type="submit"
            disabled={!content.trim() || !deadline || isUploading}
            isLoading={isPending}
            loadingText="Creating..."
            variant="primary"
            className="gap-2 px-6"
          >
            Publish Assignment
            <span className="material-symbols-outlined text-[18px]">send</span>
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}

export default function FacultyAssignmentsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [isCreating, setIsCreating] = useState(false);

  const { data: posts = [], isLoading } = usePosts(classId);
  const assignments = posts.filter(p => p.isSubmissionPost);

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Assignments</h1>
          <p className="text-on-surface-variant text-lg">Manage class assignments and monitor student submissions.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            New Assignment
          </Button>
        )}
      </div>

      {isCreating && (
        <CreateAssignmentForm classId={classId} onCancel={() => setIsCreating(false)} />
      )}

      {isLoading ? (
        <div className="p-12 text-center text-on-surface-variant font-body-lg">Loading assignments...</div>
      ) : assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map(assignment => (
            <PostCard key={assignment.id} post={assignment} isFacultyView={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <span className="material-symbols-outlined text-[32px]">assignment</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">No Assignments Yet</h3>
          <p className="text-on-surface-variant mb-6 max-w-md mx-auto">Create your first assignment to start evaluating your students.</p>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        </div>
      )}
    </div>
  );
}
