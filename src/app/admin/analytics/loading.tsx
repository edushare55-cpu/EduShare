import { StatCardSkeleton, ChartSkeleton } from "@/components/shared/Skeletons"

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <ChartSkeleton height={300} />
      <ChartSkeleton height={250} />
    </div>
  )
}
