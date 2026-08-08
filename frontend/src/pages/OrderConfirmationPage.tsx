import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, MessageCircle, Mail, Package, CreditCard, Gift } from 'lucide-react';
import { Container } from '../components/layout';
import { Button } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { fetchOrder } from '../services/orders';
import { usePageMeta } from '../hooks/usePageMeta';
import { getImageUrl, formatPrice, formatDate } from '../lib/utils';
import type { Order } from '../types';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { isAuthenticated } = useAuthStore();
  const openChat = useUiStore((s) => s.openChat);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const authenticated = isAuthenticated();

  usePageMeta({
    title: order ? `Order ${order.order_number}` : 'Order',
    description: order ? `Order ${order.order_number} — status: ${order.status}.` : undefined,
    path: order ? `/order/${order.order_number}` : undefined,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [order]);

  useEffect(() => {
    if (!orderNumber || !authenticated) return;
    fetchOrder(orderNumber)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderNumber, authenticated]);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: `/order/${orderNumber}` }} />;
  }

  if (loading) {
    return (
      <div className="pt-40 pb-40 min-h-screen bg-zinc-950 text-center">
        <p className="text-white/40 animate-pulse font-space tracking-widest uppercase text-sm">Loading order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pt-32 pb-32 min-h-screen bg-zinc-950">
        <Container>
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <p className="text-white/60 mb-8">We couldn't find that order.</p>
            <Link to="/profile/orders">
              <Button variant="outline">View my orders</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const statusSteps = ['confirmed', 'processing', 'shipped', 'delivered'];
  const statusIdx = statusSteps.indexOf(order.status as Order['status']);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="pt-32 pb-32 min-h-screen bg-zinc-950">
      <Container>
        <div className="mb-12 text-center">
          <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-6" strokeWidth={1.25} />
          <h1 className="font-display text-4xl font-medium mb-2">Thank you for your order</h1>
          <p className="text-white/50">
            Order <span className="text-gold font-space">{order.order_number}</span> has been received.
            <br />
            A confirmation has been sent to <span className="text-white">{order.email}</span>.
          </p>
        </div>

        {/* Status tracker */}
        <div className="max-w-2xl mx-auto mb-12">
          {isCancelled ? (
            <div className="text-center border border-destructive/30 bg-destructive/5 px-8 py-6">
              <p className="text-sm text-destructive font-medium uppercase tracking-widest font-space">
                Order {order.status}
              </p>
              <p className="text-xs text-white/40 mt-2">
                If you have any questions, our concierge can assist.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between mb-6">
                {statusSteps.map((step, i) => {
                  const reached = statusIdx >= i;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 flex-1 relative">
                      <div className={`h-2 w-2 rounded-full ${reached ? 'bg-gold' : 'bg-white/15'}`} />
                      <span className={`text-[10px] font-space tracking-widest uppercase ${reached ? 'text-gold' : 'text-white/40'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p className="text-sm text-white/60">
                  {order.status === 'pending'
                    ? 'Your order has been received and is awaiting confirmation.'
                    : order.status === 'confirmed'
                      ? 'Our concierge is preparing your timepiece.'
                      : `Status: ${order.status}`}
                </p>
              </div>
            </>
          )}
          <p className="text-xs text-white/30 mt-1 text-center">
            Placed on {formatDate(order.created_at)} · {order.status}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="border border-white/10 bg-zinc-900/40 p-8">
              <h2 className="text-sm font-space uppercase tracking-widest text-white/60 mb-6 flex items-center gap-2">
                <Package className="w-4 h-4" /> Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 shrink-0 bg-zinc-900 overflow-hidden">
                      <img src={getImageUrl(item.image)} alt={item.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-space tracking-[0.2em] text-gold uppercase">{item.brand_name}</p>
                      <p className="text-white line-clamp-1">{item.title}</p>
                      <p className="text-xs text-white/40">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-space text-white whitespace-nowrap">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 mt-6 pt-6 grid sm:grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-xs font-space tracking-widest uppercase text-white/40 mb-3">Shipping to</p>
                  <p className="text-white">{order.full_name}</p>
                  <p className="text-white/60">{order.address_line}</p>
                  <p className="text-white/60">{order.postal_code} {order.city}, {order.country}</p>
                  <p className="text-white/60 mt-2">{order.phone_number}</p>
                </div>
                <div>
                  <p className="text-xs font-space tracking-widest uppercase text-white/40 mb-3 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> Payment
                  </p>
                  <p className="text-white capitalize">
                    {order.payment_method === 'card' ? 'Credit card' : 'Cash on delivery'} ·{' '}
                    <span className={order.payment_status === 'paid' ? 'text-gold' : 'text-white/60'}>
                      {order.payment_status}
                    </span>
                  </p>
                  {order.gift_wrapping && (
                    <p className="text-white/60 mt-2 flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5" /> Gift wrapping included
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary + actions */}
          <div className="lg:col-span-1">
            <div className="border border-white/10 bg-zinc-900/40 p-8 space-y-6">
              <h2 className="text-xl font-space uppercase tracking-widest">Summary</h2>
              <div className="space-y-3 text-sm text-white/60">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(order.subtotal)}</span>
                </div>
                {parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between text-gold">
                    <span>Discount</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">Complimentary</span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-5 flex justify-between items-baseline">
                <span className="text-sm font-space uppercase tracking-widest text-white">Total</span>
                <span className="text-2xl font-space text-gold">{formatPrice(order.total)}</span>
              </div>

              <div className="grid gap-3">
                <Link to="/profile/orders">
                  <Button variant="outline" className="w-full">View my orders</Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = 'mailto:concierge@lustro.ch?subject=' + encodeURIComponent(`Order ${order.order_number}`);
                  }}
                >
                  <Mail className="w-4 h-4" /> Contact concierge
                </Button>
                <Button className="w-full" onClick={openChat}>
                  <MessageCircle className="w-4 h-4" /> Ask the concierge
                </Button>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-2 text-xs text-white/40">
                <p className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-gold" /> Fully insured, tracked delivery</p>
                <p className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-gold" /> 14-day easy returns</p>
                <p className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-gold" /> 5-year international warranty</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}