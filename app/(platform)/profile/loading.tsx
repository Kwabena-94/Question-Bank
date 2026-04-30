import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <section className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-6 w-48" />
          <SkeletonText lines={2} className="mt-3 max-w-xl" />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-11 rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg sm:w-24" />
          </div>
        </section>
      </div>
    </div>
  );
}
