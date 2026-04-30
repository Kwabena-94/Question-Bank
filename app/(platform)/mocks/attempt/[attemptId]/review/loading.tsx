import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function MockReviewLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-5 w-28" />

      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="rounded-xl border border-info/15 bg-info/[0.06] p-5">
        <Skeleton className="h-5 w-44" />
        <SkeletonText lines={2} className="mt-3" />
      </div>

      <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="mt-5 divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <SkeletonText lines={2} className="mt-3" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
