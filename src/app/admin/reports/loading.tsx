import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/Skeletons"

export default function AdminReportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        {[1,2,3].map((i) => (
          <div key={i}
               className="h-9 w-28 bg-surface-container-high 
                          rounded-full animate-pulse" />
        ))}
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
