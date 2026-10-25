"use client";

import PostCard from "@/components/shared/PostCard";
import { Card } from "@/components/ui/card";
import { useClass } from "@/hooks/use-class";
import { useFeedPosts } from "@/hooks/use-posts";
import { useUpcomingDeadlines } from "@/hooks/use-submissions";
import { useParams } from "next/navigation";

// --- Helpers ---
const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

export default function StudentClassFeedPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { data: classData, isLoading: isLoadingClass } = useClass(classId);
  const { data: posts = [], isLoading: isLoadingPosts } = useFeedPosts(classId);
  const { data: upcomingDeadlines = [], isLoading: isLoadingDeadlines } = useUpcomingDeadlines(classId);

  if (isLoadingClass || isLoadingPosts) {
    return <div className="p-12 text-center text-on-surface-variant font-body-lg">Loading announcements...</div>;
  }

  if (!classData) {
    return <div className="p-12 text-center text-error font-body-lg">Class not found.</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">{classData.name} Announcements</h1>
        <p className="text-on-surface-variant text-lg">Official notices, reminders, and updates from your instructor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Official announcements */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          {/* Announcement list */}
          <div className="space-y-6 mt-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} isFacultyView={false} />
              ))
            ) : (
              <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                There are no announcements for this class yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Utility Column */}
        <div className="col-span-1 lg:col-span-4 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Class Details */}
            <Card className="border-outline-variant/30 shadow-sm overflow-hidden bg-surface-container-lowest">
              <div className="bg-primary/5 p-4 border-b border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                <h3 className="font-semibold text-primary">Class Details</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Class Code</span>
                  <span className="text-sm font-medium text-on-surface bg-surface-container w-fit px-2 py-1 rounded border border-outline-variant/30">{classData.classCode}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Subject</span>
                  <span className="text-sm font-medium text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">subject</span>
                    {classData.subject}
                  </span>
                </div>
              </div>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="border-outline-variant/30 shadow-sm overflow-hidden bg-surface-container-lowest">
              <div className="bg-tertiary/5 p-4 border-b border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">upcoming</span>
                <h3 className="font-semibold text-tertiary">Upcoming Deadlines</h3>
              </div>
              <div className="p-0">
                {upcomingDeadlines.length > 0 ? (
                  <div className="flex flex-col divide-y divide-outline-variant/20">
                    {upcomingDeadlines.map((assignment: any) => (
                      <div 
                        key={assignment.id} 
                        className="p-4 hover:bg-surface-container transition-colors cursor-pointer group"
                        onClick={() => {
                          const el = document.getElementById(`post-${assignment.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            el.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-shadow");
                            setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "transition-shadow"), 2000);
                          }
                        }}
                      >
                        <div className="text-sm font-medium text-on-surface line-clamp-2 group-hover:text-tertiary transition-colors mb-2 leading-relaxed">
                          {assignment.content.split(".")[0]}
                        </div>
                        <div className="text-xs text-tertiary font-semibold flex items-center gap-1.5 bg-tertiary/10 w-fit px-2 py-1 rounded-md">
                          <span className="material-symbols-outlined text-[14px]">timer</span>
                          {formatDate(assignment.submissionDeadline!)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant/50">event_available</span>
                    <span className="text-sm text-on-surface-variant font-medium">No upcoming deadlines!</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
