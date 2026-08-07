import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-sm bg-zinc-900', className)}
      {...props}
    />
  );
}

function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
