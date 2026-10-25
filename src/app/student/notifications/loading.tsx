import { NotificationsSkeleton } from "@/components/shared/Skeletons"

export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="h-8 w-36 bg-surface-container-high 
                      rounded animate-pulse mb-md" />
      <NotificationsSkeleton count={6} />
    </div>
  )
}
