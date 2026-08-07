import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { WatchCard } from './WatchCard';
import { WatchCardSkeleton } from './WatchCardSkeleton';
import type { WatchListItem } from '../../types';

interface WatchGridProps {
  watches: WatchListItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function WatchGrid({ 
  watches, 
  isLoading = false, 
  skeletonCount = 6, 
  columns = 3,
  className 
}: WatchGridProps) {
  
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-8 gap-y-12', colClasses[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <WatchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-white/50 mb-4">No timepieces found.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className={cn('grid gap-8 gap-y-12', colClasses[columns], className)}
    >
      {watches.map((watch) => (
        <motion.div
          key={watch.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
            }
          }}
        >
          <WatchCard watch={watch} />
        </motion.div>
      ))}
    </motion.div>
  );
}
