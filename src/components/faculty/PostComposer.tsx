"use client";

import React, { useState, useRef } from "react";
import { useCreatePost } from "@/hooks/use-posts";
import { useFileUpload } from "@/hooks/use-file-upload";
import { LoadingButton } from "@/components/shared/LoadingButton";

interface PostComposerProps {
  classId: string;
}

export default function PostComposer({ classId }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachedLink, setAttachedLink] = useState("");

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
    if (!content.trim() || isUploading) return;

    createPost(
      {
        classId,
        content,
        isSubmissionPost: false,
        submissionDeadline: null,
        attachedLink: attachedLink.trim() || null,
        files: attachments,
      },
      {
        onSuccess: () => {
          setContent("");
          setIsExpanded(false);
          setAttachments([]);
          setAttachedLink("");
        },
      }
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden transition-all duration-300">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (!isExpanded && e.target.value.length > 0) setIsExpanded(true);
          }}
          onClick={() => setIsExpanded(true)}
          placeholder="Announce something to your class..."
          rows={isExpanded ? 4 : 1}
          className="w-full bg-transparent resize-none outline-none font-body-lg text-on-surface placeholder:text-on-surface-variant/70 transition-all"
        />

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 animate-in fade-in duration-300">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-outline-variant/50 bg-surface-container-low/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-outline">description</span>
                      <span className="font-label-sm truncate text-on-surface">{file.fileName}</span>
                      <span className="font-label-sm text-on-surface-variant">({Math.round(file.fileSize / 1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-outline hover:text-error transition-colors p-1 rounded-full"
                      title="Remove attachment"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link Attachment Input */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface-container-low/30 focus-within:border-primary/50 focus-within:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined text-outline text-[20px] shrink-0">link</span>
              <input
                type="url"
                value={attachedLink}
                onChange={(e) => setAttachedLink(e.target.value)}
                placeholder="Attach a link (e.g. https://example.com)"
                className="flex-1 bg-transparent outline-none font-label-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
                disabled={isPending}
              />
              {attachedLink && (
                <button
                  type="button"
                  onClick={() => setAttachedLink("")}
                  className="text-outline hover:text-error transition-colors p-0.5 rounded-full shrink-0"
                  title="Clear link"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors disabled:opacity-50"
                  title="Attach File"
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                {isUploading && (
                  <span className="font-label-sm text-primary animate-pulse">Uploading...</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                    setAttachments([]);
                    setAttachedLink("");
                  }}
                  disabled={isPending || isUploading}
                  className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  disabled={!content.trim() || isUploading}
                  isLoading={isPending}
                  loadingText="Publishing..."
                  variant="primary"
                  className="px-5 py-2 shadow-sm"
                >
                  Publish Announcement
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </LoadingButton>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
