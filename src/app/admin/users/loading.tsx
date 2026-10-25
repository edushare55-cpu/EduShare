import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/Skeletons"

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      {/* Filter tabs skeleton */}
      <div className="flex gap-2">
        {[1,2,3,4].map((i) => (
          <div key={i} 
               className="h-9 w-24 bg-surface-container-high 
                          rounded-full animate-pulse" />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  )
}
