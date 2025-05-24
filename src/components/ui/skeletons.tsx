
import { Skeleton } from './skeleton';

export const DeviceCardSkeleton = () => (
  <div className="h-48 space-y-3 p-4 border rounded-lg">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-3 w-3 rounded-full" />
    </div>
    <Skeleton className="h-4 w-24" />
    
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-7" />
    </div>
  </div>
);

export const DeviceStatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
    ))}
  </div>
);

export const DeviceHeaderSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border rounded-md p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  </div>
);
