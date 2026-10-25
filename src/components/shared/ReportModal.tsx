"use client";

import React, { useState } from "react";
import { useFileReport } from "@/hooks/use-reports";
import type { ReportReason } from "@/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  reportedUserId?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: "INAPPROPRIATE", label: "Inappropriate Content", desc: "Contains offensive, NSFW, or harmful material." },
  { value: "BULLYING", label: "Bullying / Harassment", desc: "Targeting someone with hostility or abuse." },
  { value: "UNRELATED", label: "Unrelated to Course", desc: "Spam or content that does not belong in this class." },
  { value: "SPAM", label: "Spam / Promotion", desc: "Unsolicited advertisements or repetitive posts." },
  { value: "OTHER", label: "Other", desc: "Something else that violates community guidelines." },
];

export default function ReportModal({ isOpen, onClose, postId, reportedUserId }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  
  const { mutate: fileReport, isPending } = useFileReport();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    fileReport(
      { reason, description, postId, reportedUserId },
      {
        onSuccess: () => {
          onClose();
          setReason("");
          setDescription("");
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
          <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center">
            <span className="material-symbols-outlined">flag</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Report Content</h2>
            <p className="font-body-sm text-on-surface-variant">Help us keep EduShare safe and productive.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block font-label-md text-on-surface mb-3">Why are you reporting this?</label>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                    reason === r.value
                      ? "border-primary bg-primary-container/10"
                      : "border-outline-variant/40 hover:bg-surface-container-low"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-1"
                  />
                  <div>
                    <span className="block font-label-md text-on-surface">{r.label}</span>
                    <span className="block font-body-sm text-on-surface-variant">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-label-md text-on-surface mb-2">Additional details (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any other relevant information to help us investigate."
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isPending}
              className="px-5 py-2.5 font-label-md text-label-md bg-error text-on-error rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
