import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function MocksLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-11 w-32 rounded-md" />
          <Skeleton className="h-11 w-32 rounded-md" />
          <Skeleton className="h-11 w-28 rounded-md" />
        </div>
      </header>

      <Skeleton className="h-16 rounded-lg border border-accent/20 bg-accent-light" />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
          <Skeleton className="h-5 w-44 rounded-full" />
          <Skeleton className="mt-5 h-7 w-64" />
          <SkeletonText lines={2} className="mt-3 max-w-xl" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="mt-6 h-11 w-40 rounded-md" />
        </div>

        <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="mt-5 grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_1fr]">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-44 w-full rounded-md" />
          </div>
          <div className="my-5 border-t border-neutral-100" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SkeletonCard className="min-h-64" />
        </div>
        <div className="lg:col-span-3">
          <SkeletonCard className="min-h-64" />
        </div>
      </section>
    </div>
  );
}
