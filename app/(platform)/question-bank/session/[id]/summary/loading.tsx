import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function QBSessionSummaryLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="rounded-xl border border-neutral-200/70 border-t-primary bg-white p-6 shadow-card">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-10 w-24" />
        <Skeleton className="mt-4 h-2 rounded-full" />
      </div>

      <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="mt-2 h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-md" />
        <Skeleton className="h-12 flex-1 rounded-md" />
      </div>
      <SkeletonText lines={1} className="sr-only" />
    </div>
  );
}
