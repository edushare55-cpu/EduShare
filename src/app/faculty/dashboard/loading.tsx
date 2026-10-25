import { 
  StatCardSkeleton, 
  SectionCardSkeleton,
  PageHeaderSkeleton
} from "@/components/shared/Skeletons"

export default function FacultyDashboardLoading() {
  return (
    <div className="flex flex-col gap-xl animate-in fade-in duration-300">
      <PageHeaderSkeleton wide />

      {/* Stats strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {[1,2,3].map((i) => <StatCardSkeleton key={i} horizontal />)}
      </div>

      {/* Sections grid */}
      <div className="flex flex-col gap-md">
        {/* Section header */}
        <div className="flex justify-between items-center 
                        border-b border-outline-variant/30 pb-sm">
          <div className="h-8 w-36 bg-surface-container-high 
                          rounded animate-pulse" />
          <div className="h-5 w-20 bg-surface-container-high 
                          rounded animate-pulse" />
        </div>
        {/* Section cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[1,2,3].map((i) => <SectionCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}
