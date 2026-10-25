"use client";

import React from "react";
import PostComposer from "@/components/faculty/PostComposer";
import PostCard from "@/components/shared/PostCard";
import { Card } from "@/components/ui/card";
import { useClass } from "@/hooks/use-class";
import { useFeedPosts } from "@/hooks/use-posts";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, BookX, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";

// --- Helpers ---
const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

// --- Subcomponents ---
const FeedSkeleton = () => (
  <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
    <div className="mb-8">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-6 w-96" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="col-span-1 lg:col-span-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-6 mt-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
      <div className="col-span-1 lg:col-span-4 hidden lg:block">
        <div className="sticky top-24 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error }: { error: Error | null }) => {
  let Icon = AlertTriangle;
  let title = "Something went wrong";
  let description = "We encountered an unexpected error loading class announcements.";
  let isUnauthorized = false;
  
  if (error instanceof ApiError) {
    if (error.status === 404) {
      Icon = BookX;
      title = "Class Not Found";
      description = "The class you're looking for doesn't exist or has been removed.";
    } else if (error.status === 403) {
      Icon = ShieldAlert;
      title = "Access Denied";
      description = "You don't have permission to view announcements for this class.";
      isUnauthorized = true;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 max-w-md w-full text-center shadow-sm flex flex-col items-center">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-6 ${isUnauthorized ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">{title}</h2>
        <p className="text-on-surface-variant mb-8 leading-relaxed">
          {description}
        </p>
        <Link href="/faculty/dashboard">
          <Button className="flex items-center gap-2 w-full sm:w-auto" variant="default">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default function FacultyClassFeedPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { data: classData, isLoading: isLoadingClass, isError: isClassError, error: classError } = useClass(classId);
  const { data: posts = [], isLoading: isLoadingPosts, isError: isPostsError, error: postsError } = useFeedPosts(classId);

  // Upcoming deadlines removed for faculty, replaced with Class Info in the sidebar

  if (isLoadingClass || isLoadingPosts) {
    return <FeedSkeleton />;
  }

  if (isClassError || isPostsError || !classData) {
    const error = classError || postsError || new ApiError("Class not found", 404);
    return <ErrorState error={error} />;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Official Announcements */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Class Announcements</h1>
            <p className="text-on-surface-variant">Publish official notices, reminders, and updates for enrolled students.</p>
          </div>
          <PostComposer classId={classId} />

          {/* Announcement list */}
          <div className="space-y-6 mt-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} isFacultyView={true} />
              ))
            ) : (
              <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                No announcements yet. Publish the first official update for this class.
              </div>
            )}
          </div>
        </div>

        {/* Right Utility Column */}
        <div className="col-span-1 lg:col-span-4 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Class Details Card */}
            <Card className="border-outline-variant/30 shadow-sm overflow-hidden bg-surface-container-lowest">
              <div className="bg-primary/5 p-4 border-b border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                <h3 className="font-semibold text-primary">Class Overview</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Class Code */}
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Class Code</p>
                  <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/30 group">
                    <span className="font-mono text-sm font-bold text-on-surface">{classData.classCode}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(classData.classCode);
                      }}
                      className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                      title="Copy Class Code"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                  </div>
                </div>

                {/* Subject & Section */}
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Subject & Section</p>
                  <p className="text-sm font-medium text-on-surface">{classData.subject} — {classData.name}</p>
                </div>
                
                {/* Quick Actions */}
                <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
                  <Link href={`/faculty/classes/${classId}/members`} className="w-full">
                    <Button variant="outline" className="w-full flex items-center gap-2 justify-center" size="sm">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      Student Information Sheet
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
