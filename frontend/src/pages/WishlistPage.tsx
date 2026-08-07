import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Container } from '../components/layout';
import { WatchCard } from '../components/watch';
import { Button } from '../components/ui';
import { useWishlistStore } from '../store/wishlistStore';

export default function WishlistPage() {
  const { items, clearWishlist, count } = useWishlistStore();
  const itemsCount = count();

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container>
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
              Home / Wishlist
            </div>
            <h1 className="text-4xl md:text-5xl font-light">Your Wishlist</h1>
            <p className="text-white/50 mt-3">
              {itemsCount > 0 ? `${itemsCount} timepiece${itemsCount > 1 ? 's' : ''} saved` : 'Nothing saved yet'}
            </p>
          </div>
          {itemsCount > 0 && (
            <Button variant="outline" onClick={clearWishlist}>
              Clear Wishlist
            </Button>
          )}
        </div>

        {itemsCount === 0 ? (
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <Heart className="w-12 h-12 text-white/20 mx-auto mb-6" strokeWidth={1} />
            <p className="text-white/60 mb-8">Your wishlist is empty. Save pieces you love as you browse.</p>
            <Link to="/shop">
              <Button variant="outline">Discover Timepieces</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((watch) => (
              <WatchCard key={watch.id} watch={watch} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}