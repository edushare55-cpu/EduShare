"use client";

import React from "react";
import Link from "next/link";

interface FeedPostPreviewCardProps {
  className: string;
  classCode: string;
  authorName: string;
  authorRole: "FACULTY" | "STUDENT";
  content: string;
  timeAgo: string;
  fileCount?: number;
  commentCount?: number;
  bandColor: "primary" | "secondary" | "tertiary";
  href: string;
}

const bandColorMap = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  tertiary: "bg-tertiary",
};

export default function FeedPostPreviewCard({
  className,
  classCode,
  authorName,
  authorRole,
  content,
  timeAgo,
  fileCount = 0,
  commentCount = 0,
  bandColor,
  href,
}: FeedPostPreviewCardProps) {
  return (
    <Link href={href} className="block outline-none">
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 hover:shadow-[0_8px_20px_rgba(0,35,111,0.08)] transition-all duration-300 flex gap-6 cursor-pointer">
        {/* Left: colored vertical bar */}
        <div
          className={`w-1 rounded-full shrink-0 self-stretch ${bandColorMap[bandColor]}`}
        />

        {/* Right: content area */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded-full">
              {classCode}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {timeAgo}
            </span>
          </div>

          {/* Author row */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className="material-symbols-outlined text-[14px] text-on-surface-variant"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              person
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              {authorName}
            </span>
            {authorRole === "FACULTY" && (
              <span className="font-label-sm text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full ml-1">
                Faculty
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
            {content}
          </p>

          {/* Footer row */}
          <div className="flex items-center gap-6 mt-4">
            {fileCount > 0 && (
              <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  attach_file
                </span>
                {fileCount} file{fileCount !== 1 ? "s" : ""}
              </span>
            )}
            
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                chat_bubble_outline
              </span>
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </span>

            <span className="ml-auto font-label-sm text-label-sm text-secondary hover:text-primary transition-colors flex items-center gap-1">
              View Post
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                arrow_forward
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
