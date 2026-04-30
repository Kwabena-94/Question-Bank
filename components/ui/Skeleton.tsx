export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-shimmer rounded-md bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%] ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-card sm:p-5 ${className}`}
    >
      <Skeleton className="mb-3 h-4 w-1/3" />
      <SkeletonText lines={3} />
    </div>
  );
}
