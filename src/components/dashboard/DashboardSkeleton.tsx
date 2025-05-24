
import { FC, memo } from "react";
import { DeviceStatsSkeleton, DeviceCardSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton: FC = memo(() => {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <DeviceStatsSkeleton />
      
      {/* Overview section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-full lg:col-span-2">
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="w-full sm:w-1/2 h-[250px] flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
              <div className="w-full sm:w-1/2 h-[250px] flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent devices skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <DeviceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
});

DashboardSkeleton.displayName = 'DashboardSkeleton';
