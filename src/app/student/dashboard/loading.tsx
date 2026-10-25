import {
  StatCardSkeleton,
  MySectionSkeleton,
  FeedPreviewSkeleton,
  PageHeaderSkeleton
} from "@/components/shared/Skeletons"

export default function StudentDashboardLoading() {
  return (
    <div className="flex flex-col gap-xl animate-in fade-in duration-300">
      <PageHeaderSkeleton />

      {/* Stats strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {[1,2,3].map((i) => <StatCardSkeleton key={i} horizontal />)}
      </div>

      {/* My Section */}
      <MySectionSkeleton />

      {/* Recent feed preview */}
      <FeedPreviewSkeleton />
    </div>
  )
}
