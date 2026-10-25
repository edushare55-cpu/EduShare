import { cn } from "@/lib/utils"

// ─── Base pulse block ─────────────────────────────────────────────────────────

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface-container-high rounded animate-pulse",
        className
      )}
    />
  )
}

// ─── Avatar skeleton ──────────────────────────────────────────────────────────

function AvatarPulse({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-20 h-20" }
  return (
    <div className={cn(
      "rounded-full bg-surface-container-high animate-pulse shrink-0",
      sizes[size]
    )} />
  )
}

// ─── Page header skeleton ─────────────────────────────────────────────────────

export function PageHeaderSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end 
                    justify-between gap-md">
      <div className="space-y-2">
        <Pulse className={cn("h-10", wide ? "w-80" : "w-56")} />
        <Pulse className="h-5 w-[420px] max-w-full" />
      </div>
      <div className="flex gap-3 hidden md:flex">
        <Pulse className="h-10 w-36 rounded-lg" />
        <Pulse className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────

export function StatCardSkeleton({ horizontal = false }: { horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-md 
                      border border-outline-variant/20 flex items-center gap-md">
        <div className="w-12 h-12 rounded-full bg-surface-container-high 
                        animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-9 w-16" />
        </div>
      </div>
    )
  }
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md 
                    border border-surface-variant flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <Pulse className="w-10 h-10 rounded-lg" />
        <Pulse className="h-6 w-16 rounded-md" />
      </div>
      <div className="space-y-2">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-10 w-20" />
      </div>
    </div>
  )
}

// ─── Section card skeleton ────────────────────────────────────────────────────

export function SectionCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl 
                    border border-outline-variant/20 
                    flex flex-col overflow-hidden">
      {/* Top color band */}
      <Pulse className="h-2 w-full rounded-none" />
      <div className="p-md flex flex-col gap-sm">
        {/* Badge + more button */}
        <div className="flex justify-between items-center">
          <Pulse className="h-6 w-24 rounded-full" />
          <Pulse className="h-6 w-6 rounded" />
        </div>
        {/* Title */}
        <Pulse className="h-7 w-3/4" />
        {/* Schedule */}
        <Pulse className="h-4 w-2/3" />
        {/* Room */}
        <Pulse className="h-4 w-1/2" />
        {/* Footer */}
        <div className="border-t border-outline-variant/20 pt-sm 
                        flex justify-between mt-2">
          <Pulse className="h-4 w-24" />
          <Pulse className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

// ─── My Section skeleton (student — single full-width card) ───────────────────

export function MySectionSkeleton() {
  return (
    <div className="flex flex-col gap-md">
      {/* Section header */}
      <div className="flex justify-between border-b 
                      border-outline-variant/30 pb-sm">
        <Pulse className="h-8 w-28" />
      </div>
      {/* Card */}
      <div className="bg-surface-container-lowest rounded-xl 
                      border border-outline-variant/20 overflow-hidden">
        <Pulse className="h-2 w-full rounded-none" />
        <div className="p-md flex flex-col md:flex-row gap-md">
          {/* Left content */}
          <div className="flex-1 flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <Pulse className="h-6 w-24 rounded-full" />
              <Pulse className="h-7 w-56" />
            </div>
            <Pulse className="h-4 w-40" />
            <div className="flex gap-md">
              <Pulse className="h-4 w-36" />
              <Pulse className="h-4 w-28" />
            </div>
            <div className="flex gap-md">
              <Pulse className="h-4 w-28" />
              <Pulse className="h-4 w-24" />
            </div>
          </div>
          {/* Right buttons */}
          <div className="flex flex-col gap-sm md:items-end justify-center">
            <Pulse className="h-10 w-44 rounded-lg" />
            <Pulse className="h-10 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Post card skeleton ───────────────────────────────────────────────────────

export function PostCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md 
                    border border-outline-variant/20 flex flex-col gap-md">
      {/* Author row */}
      <div className="flex items-center gap-sm">
        <AvatarPulse />
        <div className="flex-1 space-y-1">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-3 w-20" />
        </div>
        <Pulse className="h-6 w-16 rounded-full" />
      </div>
      {/* Content */}
      <div className="space-y-2">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-5/6" />
        <Pulse className="h-4 w-3/4" />
      </div>
      {/* File attachment */}
      <Pulse className="h-12 w-full rounded-lg" />
      {/* Action bar */}
      <div className="flex gap-md border-t border-outline-variant/20 pt-sm">
        <Pulse className="h-4 w-24" />
        <Pulse className="h-4 w-20" />
        <Pulse className="h-4 w-16 ml-auto" />
      </div>
    </div>
  )
}

// ─── Feed skeleton ────────────────────────────────────────────────────────────

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-md">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ─── Post composer skeleton ───────────────────────────────────────────────────

export function PostComposerSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md 
                    border border-outline-variant/20 flex flex-col gap-sm">
      <div className="flex items-center gap-sm">
        <AvatarPulse />
        <Pulse className="h-10 flex-1 rounded-lg" />
      </div>
      <div className="flex gap-sm pt-sm border-t border-outline-variant/20">
        <Pulse className="h-8 w-24 rounded-lg" />
        <Pulse className="h-8 w-20 rounded-lg" />
        <Pulse className="h-8 w-28 rounded-lg ml-auto" />
      </div>
    </div>
  )
}

// ─── Feed preview skeleton (student dashboard) ────────────────────────────────

export function FeedPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex justify-between border-b 
                      border-outline-variant/30 pb-sm">
        <Pulse className="h-8 w-48" />
        <Pulse className="h-5 w-16" />
      </div>
      {[1,2,3].map((i) => (
        <div key={i}
             className="bg-surface-container-lowest rounded-xl p-md 
                        border border-outline-variant/20 flex gap-md">
          <Pulse className="w-1 rounded-full self-stretch" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Pulse className="h-5 w-16 rounded-full" />
              <Pulse className="h-4 w-20" />
            </div>
            <Pulse className="h-4 w-32" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-3/4" />
            <div className="flex gap-md pt-1">
              <Pulse className="h-3 w-16" />
              <Pulse className="h-3 w-20" />
              <Pulse className="h-3 w-16 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md 
                    border border-surface-variant">
      {/* Chart header */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Pulse className="h-6 w-44" />
          <Pulse className="h-4 w-72" />
        </div>
        <div className="flex gap-1">
          {[1,2,3].map((i) => (
            <Pulse key={i} className="h-8 w-12 rounded-md" />
          ))}
        </div>
      </div>
      {/* Chart area — mimics line chart shape with bars */}
      <div
        className="w-full rounded-lg overflow-hidden 
                   bg-surface-container-low flex items-end gap-1 p-3"
        style={{ height }}
      >
        {Array.from({ length: 18 }).map((_, i) => {
          const heights = [40,55,45,70,60,85,75,90,70,80,65,88,72,95,85,78,92,100]
          return (
            <div
              key={i}
              className="flex-1 bg-surface-container-high rounded-t animate-pulse"
              style={{
                height: `${heights[i % heights.length]}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-6 justify-center mt-4">
        <div className="flex items-center gap-2">
          <Pulse className="w-3 h-3 rounded-full" />
          <Pulse className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Pulse className="w-3 h-3 rounded-full" />
          <Pulse className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

// ─── Recent activity skeleton (admin) ────────────────────────────────────────

export function ActivitySkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl 
                    border border-surface-variant flex flex-col">
      <div className="p-md border-b border-surface-variant 
                      flex justify-between items-center">
        <Pulse className="h-6 w-36" />
        <Pulse className="h-4 w-16" />
      </div>
      <div className="divide-y divide-surface-variant">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="p-4 flex gap-3 items-start">
            <AvatarPulse size="sm" />
            <div className="flex-1 space-y-1">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl 
                    border border-surface-variant overflow-hidden">
      {/* Table header */}
      <div className="bg-surface-container-low p-md 
                      flex gap-md border-b border-surface-variant">
        {[1,2,3,4,5].map((i) => (
          <Pulse key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      <div className="divide-y divide-surface-variant/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} 
               className="p-md flex gap-md items-center"
               style={{ animationDelay: `${i * 30}ms` }}>
            <AvatarPulse size="sm" />
            <Pulse className="h-4 flex-1" />
            <Pulse className="h-4 flex-1" />
            <Pulse className="h-6 w-20 rounded-full" />
            <Pulse className="h-4 w-24" />
            <Pulse className="h-8 w-28 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Submissions table skeleton ───────────────────────────────────────────────

export function SubmissionsTableSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl 
                    border border-outline-variant/20 overflow-hidden">
      {/* Assignment header */}
      <div className="p-md bg-surface-container-low 
                      border-b border-outline-variant/20 space-y-2">
        <Pulse className="h-6 w-64" />
        <div className="flex gap-md">
          <Pulse className="h-4 w-36" />
          <Pulse className="h-4 w-28" />
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-sm">
          <Pulse className="h-2 flex-1 rounded-full" />
          <Pulse className="h-4 w-20" />
        </div>
      </div>
      {/* Submissions rows */}
      {[1,2,3].map((i) => (
        <div key={i}
             className="p-md flex gap-md items-center 
                        border-b border-outline-variant/20">
          <AvatarPulse size="sm" />
          <Pulse className="h-4 w-32" />
          <Pulse className="h-4 flex-1" />
          <Pulse className="h-4 w-24" />
          <Pulse className="h-6 w-20 rounded-full" />
          <Pulse className="h-8 w-32 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// ─── Assignment card skeleton (student submissions) ───────────────────────────

export function AssignmentCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md 
                    border border-outline-variant/20 flex flex-col gap-md">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Pulse className="h-6 w-3/4" />
          <Pulse className="h-4 w-1/2" />
        </div>
        <Pulse className="h-6 w-24 rounded-full" />
      </div>
      {/* Deadline */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-4 rounded" />
        <Pulse className="h-4 w-48" />
      </div>
      {/* Upload area */}
      <Pulse className="h-28 w-full rounded-xl" />
      {/* Submit button */}
      <Pulse className="h-10 w-full rounded-lg" />
    </div>
  )
}

// ─── Notifications skeleton ───────────────────────────────────────────────────

export function NotificationsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-md">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}
             className="flex gap-md p-md rounded-xl 
                        border border-surface-variant"
             style={{ animationDelay: `${i * 40}ms` }}>
          <AvatarPulse />
          <div className="flex-1 space-y-2">
            <Pulse className="h-4 w-3/4" />
            <Pulse className="h-3 w-24" />
          </div>
          <Pulse className="w-2 h-2 rounded-full shrink-0 mt-2" />
        </div>
      ))}
    </div>
  )
}

// ─── Profile skeleton ─────────────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-lg">
      {/* Avatar section */}
      <div className="bg-surface-container-lowest rounded-xl p-md 
                      border border-surface-variant">
        <Pulse className="h-6 w-32 mb-md" />
        <div className="flex items-center gap-md">
          <AvatarPulse size="lg" />
          <div className="space-y-2">
            <Pulse className="h-6 w-40" />
            <Pulse className="h-4 w-52" />
            <Pulse className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      {/* Info form */}
      <div className="bg-surface-container-lowest rounded-xl p-md 
                      border border-surface-variant space-y-md">
        <Pulse className="h-6 w-36" />
        {[1,2,3].map((i) => (
          <div key={i} className="space-y-2">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Pulse className="h-10 w-32 rounded-lg" />
      </div>
      {/* Password form */}
      <div className="bg-surface-container-lowest rounded-xl p-md 
                      border border-surface-variant space-y-md">
        <Pulse className="h-6 w-40" />
        {[1,2,3].map((i) => (
          <div key={i} className="space-y-2">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Pulse className="h-10 w-40 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Lesson Skeletons (Phase 2) ───────────────────────────────────────────────

export function FacultyLessonsSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Pulse className="h-8 w-48 mb-2" />
          <Pulse className="h-4 w-32" />
        </div>
        <Pulse className="h-10 w-32 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/20
                       bg-surface-container-lowest"
          >
            <Pulse className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Pulse className="h-5 w-20 rounded-full" />
                <Pulse className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudentLessonsSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Pulse className="h-8 w-48 mb-2" />
          <Pulse className="h-4 w-32" />
        </div>
        <Pulse className="w-14 h-14 rounded-full" />
      </div>
      <Pulse className="h-2 w-full rounded-full mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant/20
                       bg-surface-container-lowest"
          >
            <Pulse className="w-[52px] h-[52px] rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Pulse className="h-4 w-16 rounded-full" />
                <Pulse className="h-4 w-24 rounded-full" />
              </div>
            </div>
            <Pulse className="w-4 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
