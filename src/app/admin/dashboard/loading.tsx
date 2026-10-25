import { 
  StatCardSkeleton, 
  ChartSkeleton,
  ActivitySkeleton 
} from "@/components/shared/Skeletons"

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page header skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-surface-container-high 
                          rounded-lg animate-pulse" />
          <div className="h-5 w-96 bg-surface-container-high 
                          rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-surface-container-high 
                          rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-surface-container-high 
                          rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats bento grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map((i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Chart + Activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ActivitySkeleton />
      </div>
    </div>
  )
}
