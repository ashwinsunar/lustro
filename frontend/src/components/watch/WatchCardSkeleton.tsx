import { Skeleton } from '../ui';
import { cn } from '../../lib/utils';

export function WatchCardSkeleton({ className, list = false }: { className?: string; list?: boolean }) {
  if (list) {
    return (
      <div className={cn('flex gap-6 border border-white/5 bg-zinc-900/30 p-4 w-full', className)}>
        <Skeleton className="aspect-square sm:w-40 shrink-0" />
        <div className="flex flex-col justify-center gap-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-24 mt-2" />
          <Skeleton className="h-10 w-40 mt-2" />
        </div>
      </div>
    );
  }
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