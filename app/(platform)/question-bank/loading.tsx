import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function QuestionBankLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-card">
        <Skeleton className="h-5 w-40" />
        <SkeletonText lines={2} className="mt-3" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-11 rounded-lg" />
        </div>
        <Skeleton className="mt-6 h-12 rounded-lg" />
      </div>

      <SkeletonCard />
    </div>
  );
}
