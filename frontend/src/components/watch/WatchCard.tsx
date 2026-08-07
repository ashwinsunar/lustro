import { motion } from 'framer-motion';
import { Heart, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, getImageUrl, formatPrice, getDiscountPercent } from '../../lib/utils';
import { Badge } from '../ui';
import { useWishlistStore } from '../../store/wishlistStore';
import type { WatchListItem } from '../../types';

interface WatchCardProps {
  watch: WatchListItem;
  className?: string;
}

export function WatchCard({ watch, className }: WatchCardProps) {
  const { isWishlisted, toggleItem } = useWishlistStore();
  const wishlisted = isWishlisted(watch.id);
  const primaryImage = watch.images?.find((img) => img.is_primary)?.image || watch.images?.[0]?.image;
  const discount = getDiscountPercent(watch.price, watch.discount_price);

  return (
    <motion.div
      whileHover="hover"
      initial="initial"
      className={cn('group relative block w-full', className)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/5">
        <Link to={`/watch/${watch.slug}`} className="absolute inset-0 z-10">
          <span className="sr-only">View {watch.title}</span>
        </Link>
        
        {/* Image */}
        <motion.img
          variants={{
            initial: { scale: 1 },
            hover: { scale: 1.05 },
          }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          src={getImageUrl(primaryImage)}
          alt={watch.title}
          className="h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Overlay (fades out on hover) */}
        <div className="absolute inset-0 bg-black/20 transition-opacity duration-500 group-hover:opacity-0 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start pointer-events-none">
          {!watch.in_stock && <Badge variant="sold_out">Sold Out</Badge>}
          {watch.in_stock && watch.is_new_arrival && <Badge variant="new">New</Badge>}
          {watch.in_stock && watch.discount_price && <Badge variant="sale">Sale -{discount}%</Badge>}
          {watch.in_stock && watch.is_featured && <Badge variant="featured">Featured</Badge>}
          {watch.in_stock && watch.is_trending && <Badge variant="trending">Trending</Badge>}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem(watch);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-gold hover:text-black transition-colors"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn('h-4 w-4', wishlisted && 'fill-current text-gold group-hover:text-black')} />
          </button>
        </div>

        {/* Quick View Button (desktop only) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden lg:block">
          <Link 
            to={`/watch/${watch.slug}`}
            className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 text-xs font-space tracking-widest text-white hover:bg-gold hover:text-black transition-colors border border-white/10"
          >
            <Eye className="h-3 w-3" />
            QUICK VIEW
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-4 flex flex-col items-start gap-1">
        <Link to={`/brands/${watch.brand.slug}`} className="text-[10px] font-space tracking-[0.2em] text-gold uppercase hover:text-white transition-colors relative z-20">
          {watch.brand.name}
        </Link>
        <Link to={`/watch/${watch.slug}`} className="text-base font-medium text-white hover:text-gold transition-colors relative z-20 line-clamp-1">
          {watch.title}
        </Link>
        
        <div className="mt-1 flex w-full items-center justify-between">
          <div className="flex items-baseline gap-2">
            {watch.discount_price ? (
              <>
                <span className="text-sm font-space text-white">{formatPrice(watch.discount_price)}</span>
                <span className="text-xs font-space text-white/40 line-through">{formatPrice(watch.price)}</span>
              </>
            ) : (
              <span className="text-sm font-space text-white">{formatPrice(watch.price)}</span>
            )}
          </div>
          
          {parseFloat(watch.rating) > 0 && (
            <div className="flex items-center gap-1 text-white/60">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="text-xs font-space">{watch.rating}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
