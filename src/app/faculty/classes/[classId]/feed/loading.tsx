import { PostComposerSkeleton, FeedSkeleton } from "@/components/shared/Skeletons"

export default function FacultyFeedLoading() {
  return (
    <div className="flex flex-col gap-md animate-in fade-in duration-300">
      <PostComposerSkeleton />
      <FeedSkeleton count={4} />
    </div>
  )
}
