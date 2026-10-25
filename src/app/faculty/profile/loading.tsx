import { ProfileSkeleton } from "@/components/shared/Skeletons"

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <ProfileSkeleton />
    </div>
  )
}
