import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function StartMockLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-5 w-28" />
      <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
        <Skeleton className="h-7 w-64 max-w-full" />
        <SkeletonText lines={3} className="mt-4" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <div className="mt-6 rounded-lg bg-neutral-50 p-4">
          <SkeletonText lines={4} />
        </div>
        <Skeleton className="mt-6 h-12 rounded-md" />
      </div>
    </div>
  );
}
