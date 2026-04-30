import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function QBSessionLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl flex-col space-y-5">
      <div className="rounded-xl border border-neutral-200/70 bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-4 h-2 rounded-full" />
      </div>

      <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-card sm:p-6">
        <Skeleton className="h-5 w-28 rounded-full" />
        <SkeletonText lines={4} className="mt-6" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200/70 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-11 w-full rounded-lg sm:w-36" />
        </div>
      </div>
    </div>
  );
}
