import { SubmissionsTableSkeleton } from "@/components/shared/Skeletons"

export default function SubmissionsLoading() {
  return (
    <div className="flex flex-col gap-md animate-in fade-in duration-300">
      <div className="h-8 w-48 bg-surface-container-high 
                      rounded animate-pulse" />
      {[1,2].map((i) => <SubmissionsTableSkeleton key={i} />)}
    </div>
  )
}
