import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-sm bg-zinc-900', className)}
      {...props}
    />
  );
}

export { Skeleton };