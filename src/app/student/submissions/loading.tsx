import { AssignmentCardSkeleton } from "@/components/shared/Skeletons"

export default function StudentSubmissionsLoading() {
  return (
    <div className="flex flex-col gap-md animate-in fade-in duration-300">
      <div className="h-8 w-48 bg-surface-container-high 
                      rounded animate-pulse" />
      {[1,2,3].map((i) => <AssignmentCardSkeleton key={i} />)}
    </div>
  )
}
