import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, Bookmark, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Container } from '../components/layout';
import { Button } from '../components/ui';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { usePageMeta } from '../hooks/usePageMeta';
import { getImageUrl, formatPrice } from '../lib/utils';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    savedForLater,
    updateQuantity,
    removeItem,
    saveForLater,
    moveToCart,
    removeSaved,
    clearCart,
    totalItems,
    totalPrice,
  } = useCartStore();

  const isEmpty = items.length === 0;

  usePageMeta({
    title: 'Shopping Cart',
    description: 'Review the timepieces in your cart and proceed to secure checkout.',
    path: '/cart',
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="pt-32 pb-32 min-h-screen bg-zinc-950">
      <Container>
        <div className="mb-12">
          <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
            Home / Cart
          </div>
          <h1 className="font-display text-4xl font-medium">Shopping Cart</h1>
        </div>

        {isEmpty ? (
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-6" strokeWidth={1} />
            <p className="text-white/60 mb-8">Your cart is empty.</p>
            <Link to="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6 border border-white/5 bg-zinc-900/40 p-5">
                  <Link to={`/watch/${item.slug}`} className="shrink-0 w-24 h-32 bg-zinc-900 overflow-hidden">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-space tracking-[0.2em] text-gold uppercase mb-1">
                          {item.brandName}
                        </p>
                        <Link
                          to={`/watch/${item.slug}`}
                          className="text-lg font-medium text-white hover:text-gold transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-white/40 hover:text-destructive transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center border border-white/10">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-space">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-lg font-space text-white">
                          {formatPrice(item.discount_price ?? item.price)}
                        </span>
                        <button
                          onClick={() => saveForLater(item.id)}
                          className="flex items-center gap-1.5 text-xs font-space tracking-widest uppercase text-white/40 hover:text-gold transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Save for later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-2">
                <button
                  onClick={clearCart}
                  className="text-xs font-space tracking-widest uppercase text-white/40 hover:text-destructive transition-colors"
                >
                  Clear cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="border border-white/10 bg-zinc-900/40 p-8 sticky top-32">
                <h2 className="text-xl font-space uppercase tracking-widest mb-6">Summary</h2>
                <div className="space-y-3 text-sm text-white/60 mb-6">
                  <div className="flex justify-between">
                    <span>Items ({totalItems()})</span>
                    <span className="text-white">{formatPrice(totalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-white">Complimentary</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6 mb-8 flex justify-between items-baseline">
                  <span className="text-sm font-space uppercase tracking-widest text-white">Total</span>
                  <span className="text-2xl font-space text-gold">{formatPrice(totalPrice())}</span>
                </div>
                <Button
                  className="w-full mb-4"
                  onClick={() => {
                    if (!isAuthenticated()) {
                      toast.error('Please sign in to checkout.');
                      navigate('/login', { state: { from: '/checkout' } });
                      return;
                    }
                    navigate('/checkout');
                  }}
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Button>
                <Link to="/shop" className="block text-center text-xs font-space tracking-widest uppercase text-white/40 hover:text-gold transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Saved for later */}
        {savedForLater.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-light mb-8">Saved for Later</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedForLater.map((item) => (
                <div key={item.id} className="border border-white/5 bg-zinc-900/40 p-4">
                  <Link to={`/watch/${item.slug}`} className="block aspect-[3/4] bg-zinc-900 overflow-hidden mb-4">
                    <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                  </Link>
                  <p className="text-[10px] font-space tracking-[0.2em] text-gold uppercase mb-1">{item.brandName}</p>
                  <Link to={`/watch/${item.slug}`} className="text-sm text-white hover:text-gold transition-colors line-clamp-1">
                    {item.title}
                  </Link>
                  <p className="text-sm font-space text-white mt-2">{formatPrice(item.discount_price ?? item.price)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => moveToCart(item.id)}
                  >
                    Move to Cart
                  </Button>
                  <button
                    onClick={() => removeSaved(item.id)}
                    className="w-full text-center mt-2 text-xs font-space tracking-widest uppercase text-white/40 hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}