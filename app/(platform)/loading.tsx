import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function PlatformLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2" />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
