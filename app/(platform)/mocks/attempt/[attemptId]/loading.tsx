import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function MockAttemptLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col space-y-5">
      <div className="rounded-xl border border-neutral-200/70 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
        <Skeleton className="mt-4 h-2 rounded-full" />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1fr_16rem]">
        <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-card sm:p-6">
          <Skeleton className="h-5 w-28 rounded-full" />
          <SkeletonText lines={5} className="mt-6" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200/70 bg-white p-4 shadow-card">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
