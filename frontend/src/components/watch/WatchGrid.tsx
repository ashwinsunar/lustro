import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { cn, getImageUrl, formatPrice } from '../../lib/utils';
import { WatchCard } from './WatchCard';
import { WatchCardSkeleton } from './WatchCardSkeleton';
import { Badge } from '../ui';
import type { WatchListItem } from '../../types';

interface WatchGridProps {
  watches: WatchListItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  columns?: 2 | 3 | 4;
  variant?: 'grid' | 'list';
  className?: string;
}

export function WatchGrid({
  watches,
  isLoading = false,
  skeletonCount = 6,
  columns = 3,
  variant = 'grid',
  className,
}: WatchGridProps) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn(variant === 'list' ? 'flex flex-col gap-6' : 'grid gap-8 gap-y-12', colClasses[columns], className)}>
        {Array.from({ length: variant === 'list' ? 4 : skeletonCount }).map((_, i) => (
          <WatchCardSkeleton key={i} list={variant === 'list'} />
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

  if (variant === 'list') {
    return (
      <div className="flex flex-col gap-6">
        {watches.map((watch) => {
          const primaryImage = watch.images?.find((img) => img.is_primary)?.image || watch.images?.[0]?.image;
          return (
            <motion.div
              key={watch.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="group flex flex-col sm:flex-row gap-6 border border-white/5 bg-zinc-900/30 p-4 hover:border-white/15 transition-colors">
                <Link
                  to={`/watch/${watch.slug}`}
                  className="relative block aspect-[4/3] sm:aspect-square sm:w-40 shrink-0 overflow-hidden bg-zinc-900 border border-white/5"
                >
                  <img
                    src={getImageUrl(primaryImage)}
                    alt={watch.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                  />
                  {!watch.in_stock && (
                    <Badge variant="sold_out" className="absolute top-2 left-2">Sold Out</Badge>
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-center min-w-0 py-1">
                  <Link to={`/brands/${watch.brand.slug}`} className="text-[10px] font-space tracking-[0.2em] text-gold uppercase hover:text-white transition-colors">
                    {watch.brand.name}
                  </Link>
                  <Link to={`/watch/${watch.slug}`} className="text-lg font-medium text-white hover:text-gold transition-colors line-clamp-1 mt-1">
                    {watch.title}
                  </Link>
                  <p className="text-xs text-white/40 mt-1 capitalize">
                    {watch.category.name} · {watch.movement.replace('_', ' ')} · {watch.gender}
                  </p>
                  <div className="flex items-baseline gap-2 mt-3">
                    {watch.discount_price ? (
                      <>
                        <span className="font-space text-white">{formatPrice(watch.discount_price)}</span>
                        <span className="text-xs font-space text-white/40 line-through">{formatPrice(watch.price)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-space text-white">{formatPrice(watch.price)}</span>
                    )}
                    {parseFloat(watch.rating) > 0 && (
                      <span className="flex items-center gap-1 text-white/60 text-xs font-space">
                        <Star className="w-3 h-3 fill-gold text-gold" /> {watch.rating}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/watch/${watch.slug}`}
                    className="mt-4 inline-flex w-fit items-center gap-2 border border-white/15 px-5 py-2.5 text-xs font-space tracking-widest uppercase text-white/70 hover:border-gold hover:text-gold transition-colors"
                  >
                    {watch.in_stock ? 'View & Add to Cart' : 'View piece'}
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
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
            staggerChildren: 0.1,
          },
        },
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
              transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
            },
          }}
        >
          <WatchCard watch={watch} />
        </motion.div>
      ))}
    </motion.div>
  );
}