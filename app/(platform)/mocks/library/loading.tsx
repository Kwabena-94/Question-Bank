import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function MockLibraryLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-5 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-44" />
        ))}
      </div>
    </div>
  );
}
