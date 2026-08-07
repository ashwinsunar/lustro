import { Skeleton } from '../ui';
import { cn } from '../../lib/utils';

export function WatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-full', className)}>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-full" />
        <div className="flex justify-between items-center mt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}
