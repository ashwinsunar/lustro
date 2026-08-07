import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Container } from '../components/layout';
import { Button } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { fetchOrders } from '../services/orders';
import { getImageUrl, formatPrice, formatDate, cn } from '../lib/utils';
import type { Order } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400',
  confirmed: 'text-gold',
  processing: 'text-sky-400',
  shipped: 'text-violet-400',
  delivered: 'text-emerald-400',
  cancelled: 'text-destructive',
  refunded: 'text-white/50',
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'My Orders — Lustro';
    window.scrollTo({ top: 0 });
    if (!isAuthenticated()) return;
    fetchOrders()
      .then(setOrders)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: '/profile/orders' }} />;
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-zinc-950">
      <Container>
        <div className="mb-12">
          <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">Account</div>
          <h1 className="text-4xl font-light mb-2">My Orders</h1>
          <p className="text-white/50 text-sm">Track and review every timepiece you've acquired.</p>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <p className="text-white/40 animate-pulse font-space tracking-widest uppercase text-sm">Loading orders…</p>
          </div>
        ) : error ? (
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <p className="text-white/60 mb-8">We couldn't load your orders.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-6" strokeWidth={1} />
            <p className="text-white/60 mb-8">No orders yet. Your first timepiece awaits.</p>
            <Link to="/shop">
              <Button variant="outline">Browse the collection</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isOpen = expanded === order.order_number;
              return (
                <div key={order.order_number} className="border border-white/10 bg-zinc-900/40">
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.order_number)}
                    className="w-full flex items-center gap-6 px-8 py-6 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-space text-sm text-gold">{order.order_number}</p>
                      <p className="text-xs text-white/40 mt-1">{formatDate(order.created_at)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={cn('text-sm font-space uppercase tracking-widest', STATUS_COLORS[order.status] ?? 'text-white/60')}>
                      {order.status}
                    </span>
                    <span className="text-lg font-space text-white hidden sm:block w-32 text-right">{formatPrice(order.total)}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-8 py-6">
                      <div className="space-y-4 mb-6">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-14 h-18 shrink-0 bg-zinc-900 overflow-hidden">
                              <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-space tracking-[0.2em] text-gold uppercase">{item.brand_name}</p>
                              <p className="text-sm text-white line-clamp-1">{item.title}</p>
                              <p className="text-xs text-white/40">Qty {item.quantity} · {formatPrice(item.unit_price)} each</p>
                            </div>
                            <span className="text-sm font-space text-white whitespace-nowrap">{formatPrice(item.total_price)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 text-sm border-t border-white/10 pt-5">
                        <div>
                          <p className="text-xs font-space tracking-widest uppercase text-white/40 mb-2">Delivery to</p>
                          <p className="text-white/80">{order.full_name}</p>
                          <p className="text-white/50">{order.address_line}, {order.postal_code} {order.city}</p>
                          <p className="text-white/50">{order.country} · {order.phone_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-space tracking-widest uppercase text-white/40 mb-2">Payment</p>
                          <p className="text-white/80 capitalize">{order.payment_method === 'card' ? 'Credit card' : 'Cash on delivery'}</p>
                          <p className={cn(order.payment_status === 'paid' ? 'text-gold' : 'text-white/50')}>{order.payment_status}</p>
                          <p className="text-white/50 mt-1">Total {formatPrice(order.total)}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <Link to={`/order/${order.order_number}`}>
                          <Button variant="outline" size="sm">View details</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}