import React from "react";
import Link from "next/link";
import FeedPostPreviewCard from "./FeedPostPreviewCard";
import type { Post } from "@/types";

interface RecentFeedPreviewProps {
  posts: Post[];
}

export default function RecentFeedPreview({ posts }: RecentFeedPreviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          Recent Announcements
        </h3>
        <Link
          href="/student/classes"
          className="font-label-md text-label-md text-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          View Classes
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <FeedPostPreviewCard
              key={post.id}
              className={post.class?.name || "Class"}
              classCode={post.class?.classCode || "Code"}
              authorName={post.author?.name || "Unknown"}
              authorRole={(post.author?.role as "STUDENT" | "FACULTY") || "STUDENT"}
              content={post.content}
              timeAgo={new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                Math.ceil((new Date(post.createdAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                "day"
              )}
              fileCount={post.files?.length || 0}
              commentCount={post._count?.comments || 0}
              bandColor={post.isSubmissionPost ? "tertiary" : "primary"}
              href={`/student/classes/${post.classId}/feed`}
            />
          ))
        ) : (
          <div className="text-center py-8 text-on-surface-variant font-body-lg bg-surface-container-lowest rounded-xl border border-outline-variant/30">
            No recent activity.
          </div>
        )}
      </div>
    </div>
  );
}
