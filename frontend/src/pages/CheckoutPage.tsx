import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Banknote, Gift, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '../components/layout';
import { Button, Input } from '../components/ui';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { getImageUrl, formatPrice, cn } from '../lib/utils';
import { createOrder, validateCoupon } from '../services/orders';
import { usePageMeta } from '../hooks/usePageMeta';
import type { Coupon } from '../types';

interface ShippingForm {
  full_name: string;
  email: string;
  phone_number: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
}

const EMPTY_SHIPPING: ShippingForm = {
  full_name: '',
  email: '',
  phone_number: '',
  address_line: '',
  city: '',
  postal_code: '',
  country: 'Switzerland',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, totalItems, totalPrice } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [shipping, setShipping] = useState<ShippingForm>({
    ...EMPTY_SHIPPING,
    full_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
    email: user?.email ?? '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [notes, setNotes] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: 'Checkout',
    description: 'Complete your purchase — complimentary insured shipping and 14-day returns on every Lustro timepiece.',
    path: '/checkout',
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const subtotal = totalPrice();
  const discount = coupon ? Math.round(subtotal * (coupon.discount_percent / 100) * 100) / 100 : 0;
  const total = Math.max(subtotal - discount, 0);

  const couponApplied = useMemo(() => coupon, [coupon]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setError(null);
    try {
      const c = await validateCoupon(code);
      setCoupon(c);
      toast.success(`Coupon ${c.code} applied — ${c.discount_percent}% off`);
    } catch (e: any) {
      setCoupon(null);
      toast.error(e?.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const formatCardNumber = (value: string) =>
    value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const validateForm = (): string | null => {
    if (!shipping.full_name.trim()) return 'Please enter your full name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(shipping.email)) return 'Please enter a valid email address.';
    if (!shipping.phone_number.trim()) return 'Please enter a phone number.';
    if (!shipping.address_line.trim()) return 'Please enter your street address.';
    if (!shipping.city.trim()) return 'Please enter your city.';
    if (!shipping.postal_code.trim()) return 'Please enter your postal code.';
    if (!shipping.country.trim()) return 'Please enter your country.';
    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length !== 16) return 'Please enter a valid 16-digit card number.';
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return 'Please enter a valid expiry date (MM/YY).';
      if (cardCvc.replace(/\D/g, '').length < 3) return 'Please enter a valid CVC.';
    }
    return null;
  };

  const placeOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({ watch_id: i.id, quantity: i.quantity })),
        shipping: {
          full_name: shipping.full_name.trim(),
          email: shipping.email.trim(),
          phone_number: shipping.phone_number.trim(),
          address_line: shipping.address_line.trim(),
          city: shipping.city.trim(),
          postal_code: shipping.postal_code.trim(),
          country: shipping.country.trim(),
        },
        payment_method: paymentMethod,
        coupon_code: coupon?.code,
        gift_wrapping: giftWrapping,
        notes: notes.trim() || undefined,
      });
      clearCart();
      toast.success('Order placed successfully');
      navigate(`/order/${order.order_number}`);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
        toast.error(detail);
      } else if (e?.response?.data?.items) {
        setError('One of the items is no longer available in the requested quantity.');
        toast.error('Insufficient stock');
      } else {
        setError('Something went wrong placing your order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-32 min-h-screen bg-zinc-950">
        <Container>
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <p className="text-white/60 mb-8">Your cart is empty.</p>
            <Link to="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-zinc-950">
      <Container>
        <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-space tracking-widest uppercase text-white/40 hover:text-gold transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to cart
        </Link>
        <h1 className="font-display text-4xl font-medium mb-12">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2 space-y-10">
            {/* Contact & Shipping */}
            <section>
              <h2 className="text-sm font-space uppercase tracking-widest text-white/60 mb-6">1 · Shipping details</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Full name"
                  value={shipping.full_name}
                  onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                  autoComplete="name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={shipping.email}
                  onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                  placeholder="jean@example.com"
                  autoComplete="email"
                />
                <Input
                  label="Phone"
                  value={shipping.phone_number}
                  onChange={(e) => setShipping({ ...shipping, phone_number: e.target.value })}
                  placeholder="+41 79 123 45 67"
                  autoComplete="tel"
                />
                <Input
                  label="Country"
                  value={shipping.country}
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  placeholder="Switzerland"
                  autoComplete="country-name"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Street address"
                    value={shipping.address_line}
                    onChange={(e) => setShipping({ ...shipping, address_line: e.target.value })}
                    placeholder="Rue du Rhône 17"
                    autoComplete="street-address"
                  />
                </div>
                <Input
                  label="City"
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  placeholder="Geneva"
                  autoComplete="address-level2"
                />
                <Input
                  label="Postal code"
                  value={shipping.postal_code}
                  onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })}
                  placeholder="1204"
                  autoComplete="postal-code"
                />
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-sm font-space uppercase tracking-widest text-white/60 mb-6">2 · Payment</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    'flex items-center gap-3 border p-5 text-left transition-colors',
                    paymentMethod === 'card'
                      ? 'border-gold/60 bg-gold/5'
                      : 'border-white/10 hover:border-white/30'
                  )}
                >
                  <CreditCard className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-sm font-medium">Credit / debit card</p>
                    <p className="text-xs text-white/40 mt-1">Simulated secure payment</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={cn(
                    'flex items-center gap-3 border p-5 text-left transition-colors',
                    paymentMethod === 'cod'
                      ? 'border-gold/60 bg-gold/5'
                      : 'border-white/10 hover:border-white/30'
                  )}
                >
                  <Banknote className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-sm font-medium">Cash on delivery</p>
                    <p className="text-xs text-white/40 mt-1">Pay when your watch arrives</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input
                      label="Card number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                  </div>
                  <Input
                    label="Expiry"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                  />
                  <Input
                    label="CVC"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    inputMode="numeric"
                  />
                </div>
              )}
            </section>

            {/* Extras */}
            <section>
              <h2 className="text-sm font-space uppercase tracking-widest text-white/60 mb-6">3 · Preferences</h2>
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={giftWrapping}
                  onChange={(e) => setGiftWrapping(e.target.checked)}
                  className="mt-1 accent-[#c9a962]"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Gift className="w-4 h-4 text-gold" /> Gift wrapping
                  </span>
                  <span className="text-xs text-white/40">Complimentary — signature Lustro box and ribbon.</span>
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes for our concierge (optional)"
                rows={3}
                className="w-full rounded-sm border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:border-gold/50 resize-none"
              />
            </section>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="border border-white/10 bg-zinc-900/40 p-8 sticky top-32 space-y-6">
              <h2 className="text-xl font-space uppercase tracking-widest">Your order</h2>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-14 h-18 shrink-0 bg-zinc-900 overflow-hidden">
                      <img src={getImageUrl(item.image)} alt={item.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-space tracking-[0.2em] text-gold uppercase">{item.brandName}</p>
                      <p className="text-sm text-white line-clamp-1">{item.title}</p>
                      <p className="text-xs text-white/40">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-space text-white whitespace-nowrap">
                      {formatPrice((parseFloat(item.discount_price ?? item.price)) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div>
                {couponApplied ? (
                  <div className="flex items-center justify-between border border-gold/40 bg-gold/5 px-4 py-3">
                    <span className="text-sm text-gold font-space">{couponApplied.code}</span>
                    <span className="text-xs text-white/60">−{couponApplied.discount_percent}%</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      placeholder="Coupon code (try LUSTRO10)"
                      className="flex-1 h-11 rounded-sm border border-white/10 bg-zinc-900 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:border-gold/50 font-space"
                    />
                    <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading}>
                      {couponLoading ? '…' : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-5 space-y-3 text-sm text-white/60">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems()} items)</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-gold">
                    <span>Coupon {couponApplied.code}</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Shipping</span>
                  <span className="text-white">Complimentary</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5 flex justify-between items-baseline">
                <span className="text-sm font-space uppercase tracking-widest text-white">Total</span>
                <span className="text-2xl font-space text-gold">{formatPrice(total)}</span>
              </div>

              {error && (
                <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 px-4 py-3">{error}</p>
              )}

              <Button className="w-full" onClick={placeOrder} disabled={submitting}>
                {submitting ? 'Placing order…' : `Place order · ${formatPrice(total)}`} <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-space tracking-widest uppercase text-white/30">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure</span>
                <span>·</span>
                <span>Insured delivery</span>
                <span>·</span>
                <span>14-day returns</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
