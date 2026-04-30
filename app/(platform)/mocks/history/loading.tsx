import { Skeleton } from "@/components/ui/Skeleton";

export default function MockHistoryLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-5 w-28" />

      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200/70 bg-white shadow-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={i > 0 ? "border-t border-neutral-100 p-4" : "p-4"}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-48 max-w-full" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
