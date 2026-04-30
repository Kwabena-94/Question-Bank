import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="mt-4 h-6 w-48" />
              <SkeletonText lines={2} className="mt-3 max-w-md" />
              <Skeleton className="mt-5 h-5 w-32" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="min-w-[180px] flex-1">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
              <Skeleton className="mt-3 h-3 w-28" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
