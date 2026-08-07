import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Minus, Plus, Heart, Truck, ShieldCheck, RotateCcw, Star, Check, BadgeCheck, Bell, Loader2 } from 'lucide-react';

import { Container } from '../components/layout';
import { Button, Badge } from '../components/ui';
import { WatchCard, WatchCardSkeleton } from '../components/watch';
import { fetchWatch, fetchRelated } from '../services/watches';
import { fetchReviews, createReview } from '../services/reviews';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCompareStore } from '../store/compareStore';
import { useAuthStore } from '../store/authStore';
import { cn, getImageUrl, formatPrice, getDiscountPercent, formatDate } from '../lib/utils';
import type { Review } from '../types';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [submittingNotify, setSubmittingNotify] = useState(false);

  const { addItem } = useCartStore();
  const { isWishlisted, toggleItem } = useWishlistStore();
  const { isComparing, toggleItem: toggleCompare } = useCompareStore();
  const { isAuthenticated } = useAuthStore();

  const { data: watch, isLoading, isError } = useQuery({
    queryKey: ['watch', slug],
    queryFn: () => fetchWatch(slug as string),
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['watches', 'related', watch?.id, watch?.brand?.slug],
    queryFn: () => fetchRelated(watch!.id, watch!.brand.slug),
    enabled: !!watch,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => fetchReviews(slug as string),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
        <Container className="grid lg:grid-cols-2 gap-16">
          <WatchCardSkeleton className="aspect-[3/4]" />
          <div className="space-y-6 pt-8">
            <WatchCardSkeleton className="h-8" />
            <WatchCardSkeleton className="h-6 w-1/2" />
            <WatchCardSkeleton className="h-40" />
          </div>
        </Container>
      </div>
    );
  }

  if (isError || !watch) {
    return (
      <div className="pt-32 pb-32 bg-zinc-950 min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-white/60 mb-8">We couldn't find this timepiece.</p>
        <Link to="/shop">
          <Button variant="outline">Back to the Shop</Button>
        </Link>
      </div>
    );
  }

  const discount = getDiscountPercent(watch.price, watch.discount_price);
  const wishlisted = isWishlisted(watch.id);
  const comparing = isComparing(watch.id);
  const images = watch.images?.length ? watch.images : [];

  const handleAddToCart = () => {
    const primaryImage = images.find((img) => img.is_primary)?.image || images[0]?.image || '';
    addItem({
      id: watch.id,
      title: watch.title,
      price: watch.price,
      discount_price: watch.discount_price,
      brandName: watch.brand.name,
      image: primaryImage,
      quantity,
      slug: watch.slug,
    });
    toast.success(`${watch.title} added to your cart`);
  };

  const handleSubmitReview = async () => {
    if (!reviewBody.trim()) {
      toast.error('Please write a few words about the watch.');
      return;
    }
    setSubmittingReview(true);
    try {
      const created = await createReview(slug as string, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: reviewBody.trim(),
      });
      toast.success('Thank you — your review is live.');
      setReviewRating(5);
      setReviewTitle('');
      setReviewBody('');
      refetchReviews();
      void created;
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      toast.error(detail || 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const specRows: Array<[string, string]> = [
    ['Movement', watch.movement.replace('_', ' ')],
    ['Case', `${watch.case_size} · ${watch.case_material}`],
    ['Dial', watch.dial_color],
    ['Strap', watch.strap_material],
    ['Water Resistance', watch.water_resistance],
    ['Gender', watch.gender],
    ['Warranty', watch.warranty_period],
  ];

  return (
    <div className="pt-32 pb-24 bg-zinc-950 min-h-screen">
      <Container>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-space tracking-widest uppercase text-white/40 mb-10 flex-wrap">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold transition-colors">Collections</Link>
          <span>/</span>
          <Link to={`/brands/${watch.brand.slug}`} className="hover:text-gold transition-colors">
            {watch.brand.name}
          </Link>
          <span>/</span>
          <span className="text-white/70">{watch.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Gallery */}
          <div>
            <div className="aspect-[3/4] bg-zinc-900 border border-white/5 overflow-hidden relative">
              {images.length > 0 ? (
                <img
                  src={getImageUrl(images[activeImage]?.image)}
                  alt={watch.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  Image coming soon
                </div>
              )}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                {!watch.in_stock && <Badge variant="sold_out">Sold Out</Badge>}
                {watch.in_stock && watch.discount_price && <Badge variant="sale">Sale -{discount}%</Badge>}
                {watch.in_stock && watch.is_new_arrival && <Badge variant="new">New</Badge>}
                {watch.is_trending && <Badge variant="trending">Trending</Badge>}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'aspect-square bg-zinc-900 border overflow-hidden transition-colors',
                      activeImage === i ? 'border-gold' : 'border-white/5 hover:border-white/30'
                    )}
                  >
                    <img src={getImageUrl(img.image)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <Link
                to={`/brands/${watch.brand.slug}`}
                className="text-[11px] font-space tracking-[0.25em] text-gold uppercase mb-3 inline-block hover:text-white transition-colors"
              >
                {watch.brand.name} · Est. {watch.brand.founded_year ?? '—'}
              </Link>
              <h1 className="text-4xl md:text-5xl font-light mb-4">{watch.title}</h1>
              <p className="text-white/50 text-sm font-space tracking-widest uppercase mb-6">
                {watch.reference_number}
              </p>

              <div className="flex items-center gap-3 mb-8">
                {parseFloat(watch.rating) > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      <span className="text-sm font-space">{watch.rating}</span>
                    </div>
                    <span className="text-white/40 text-sm">·</span>
                    <span className="text-white/40 text-sm">{watch.review_count} reviews</span>
                  </>
                ) : (
                  <span className="text-white/40 text-sm">New arrival</span>
                )}
              </div>

              <div className="flex items-baseline gap-4 mb-3">
                {watch.discount_price ? (
                  <>
                    <span className="text-3xl font-space text-gold">{formatPrice(watch.discount_price)}</span>
                    <span className="text-lg font-space text-white/40 line-through">{formatPrice(watch.price)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-space text-white">{formatPrice(watch.price)}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-10 text-sm">
                {watch.in_stock ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                    <span className="text-white/70">In stock</span>
                    {watch.stock_count > 0 && watch.stock_count <= 5 && (
                      <span className="text-amber-400/90">· Only {watch.stock_count} left</span>
                    )}
                    <span className="text-white/40">· Ships within 24h</span>
                  </>
                ) : (
                  <>
                    <span className="text-destructive/90 font-medium">Out of stock</span>
                    <span className="text-white/40">· Notify me when available</span>
                  </>
                )}
              </div>

              {!watch.in_stock && (
                <div className="mb-10 border border-white/10 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-gold" />
                    <span className="text-sm font-medium">Join the waitlist</span>
                  </div>
                  <p className="text-xs text-white/50 mb-4">This timepiece is currently sold out. Leave your email and we'll let you know the moment it's back.</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-gold/60 transition-colors"
                    />
                    <Button
                      size="lg"
                      disabled={submittingNotify}
                      onClick={async () => {
                        if (!notifyEmail) return;
                        setSubmittingNotify(true);
                        try {
                          await api.post(`/api/v1/watches/${watch.slug}/notify/`, { email: notifyEmail });
                          toast.success('You are on the waitlist — we will notify you when it is back in stock.');
                          setNotifyEmail('');
                        } catch {
                          toast.error('Could not join the waitlist. Please try again.');
                        } finally {
                          setSubmittingNotify(false);
                        }
                      }}
                    >
                      {submittingNotify ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify me'}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-white/60 leading-relaxed mb-10">{watch.description}</p>

              <div className="flex items-center gap-4 mb-10">
                {watch.in_stock && (
                  <div className="flex items-center border border-white/10">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-11 h-12 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-space">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-11 h-12 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Button
                  className="flex-1"
                  disabled={!watch.in_stock}
                  onClick={handleAddToCart}
                >
                  {watch.in_stock ? 'Add to Cart' : 'Sold Out'}
                </Button>
                <button
                  onClick={() => toggleItem({
                    id: watch.id, title: watch.title, slug: watch.slug, brand: { id: watch.brand.id, name: watch.brand.name, slug: watch.brand.slug },
                    category: { id: watch.category.id, name: watch.category.name, slug: watch.category.slug },
                    price: watch.price, discount_price: watch.discount_price, movement: watch.movement, gender: watch.gender,
                    in_stock: watch.in_stock, is_featured: watch.is_featured, is_trending: watch.is_trending,
                    is_new_arrival: watch.is_new_arrival, is_best_seller: watch.is_best_seller,
                    rating: watch.rating, review_count: watch.review_count, images: watch.images || [],
                  })}
                  className={cn(
                    'w-12 h-12 border flex items-center justify-center transition-colors',
                    wishlisted ? 'border-gold text-gold' : 'border-white/10 text-white/60 hover:border-white/40 hover:text-white'
                  )}
                  aria-label="Toggle wishlist"
                >
                  <Heart className={cn('w-5 h-5', wishlisted && 'fill-current')} />
                </button>
              </div>

              <button
                onClick={() => toggleCompare({
                  id: watch.id, title: watch.title, slug: watch.slug, brand: { id: watch.brand.id, name: watch.brand.name, slug: watch.brand.slug },
                  category: { id: watch.category.id, name: watch.category.name, slug: watch.category.slug },
                  price: watch.price, discount_price: watch.discount_price, movement: watch.movement, gender: watch.gender,
                  in_stock: watch.in_stock, is_featured: watch.is_featured, is_trending: watch.is_trending,
                  is_new_arrival: watch.is_new_arrival, is_best_seller: watch.is_best_seller,
                  rating: watch.rating, review_count: watch.review_count, images: watch.images || [],
                })}
                className="flex items-center gap-2 text-xs font-space tracking-widest uppercase text-white/50 hover:text-gold transition-colors mb-10"
              >
                {comparing ? <><Check className="w-4 h-4" /> Added to compare</> : <>Compare this piece</>}
              </button>
            </div>

            {/* Assurance row */}
            <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-6 mb-10">
              {[
                { icon: Truck, label: 'Complimentary shipping' },
                { icon: ShieldCheck, label: '5-year warranty' },
                { icon: RotateCcw, label: '30-day returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2">
                  <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
                  <span className="text-[10px] font-space tracking-widest uppercase text-white/50">{label}</span>
                </div>
              ))}
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-sm font-space uppercase tracking-widest text-white mb-4">Specifications</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {specRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                    <dt className="text-white/40">{k}</dt>
                    <dd className="text-white capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-light mb-2">Collector Reviews</h2>
              <div className="flex items-center gap-3">
                {parseFloat(watch.rating) > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-gold text-gold" />
                      <span className="text-lg font-space text-white">{watch.rating}</span>
                    </div>
                    <span className="text-white/40 text-sm">{watch.review_count} verified reviews</span>
                  </>
                ) : (
                  <span className="text-white/40 text-sm">No reviews yet — be the first.</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Write review */}
            <div>
              {isAuthenticated() ? (
                <div className="border border-white/10 bg-zinc-900/40 p-8 lg:sticky lg:top-32 space-y-5">
                  <h3 className="text-sm font-space uppercase tracking-widest text-white">Share your experience</h3>
                  <div>
                    <span className="block mb-2 text-xs font-space tracking-widest uppercase text-white/60">Your rating</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setReviewRating(n)}
                          className="p-1 transition-transform hover:scale-110"
                          aria-label={`${n} stars`}
                        >
                          <Star className={cn('w-6 h-6', n <= reviewRating ? 'fill-gold text-gold' : 'text-white/30')} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Review headline (optional)"
                    className="w-full h-11 rounded-sm border border-white/10 bg-zinc-900 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:border-gold/50 font-space"
                  />
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="What do you love about this timepiece?"
                    rows={4}
                    className="w-full rounded-sm border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:border-gold/50 resize-none"
                  />
                  <Button className="w-full" onClick={handleSubmitReview} isLoading={submittingReview}>
                    Submit review
                  </Button>
                </div>
              ) : (
                <div className="border border-white/10 bg-zinc-900/40 p-8 lg:sticky lg:top-24">
                  <h3 className="text-sm font-space uppercase tracking-widest text-white mb-4">Own this watch?</h3>
                  <p className="text-white/50 text-sm mb-6">Sign in to share your experience with fellow collectors.</p>
                  <Link to="/login" state={{ from: `/watch/${watch.slug}` }}>
                    <Button variant="outline" className="w-full">Sign in to review</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Review list */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <p className="text-white/40 border border-white/5 bg-zinc-900/30 p-10 text-center">
                  No reviews yet. Be the first collector to share your thoughts.
                </p>
              ) : (
                reviews.map((review: Review) => (
                  <div key={review.id} className="border border-white/10 bg-zinc-900/40 p-8">
                    <div className="flex items-start justify-between gap-6 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{review.first_name}</span>
                          {review.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-space tracking-widest uppercase text-emerald-400">
                              <BadgeCheck className="w-3.5 h-3.5" /> Verified purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={cn('w-3.5 h-3.5', n <= review.rating ? 'fill-gold text-gold' : 'text-white/20')} />
                          ))}
                          {review.helpful_count > 0 && (
                            <span className="ml-3 text-xs text-white/40">{review.helpful_count} found this helpful</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-white/30 whitespace-nowrap">{formatDate(review.created_at)}</span>
                    </div>
                    {review.title && <h4 className="text-white font-medium mb-2">{review.title}</h4>}
                    <p className="text-white/60 leading-relaxed text-sm">{review.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="mt-24">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl font-light">From the Same Maison</h2>
            <Link to={`/brands/${watch.brand.slug}`} className="text-xs font-space tracking-widest uppercase text-gold hover:text-white transition-colors">
              View all {watch.brand.name} →
            </Link>
          </div>
          {related.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((w) => (
                <WatchCard key={w.id} watch={w} />
              ))}
            </div>
          ) : (
            <p className="text-white/40">More pieces from this maison arriving soon.</p>
          )}
        </div>
      </Container>
    </div>
  );
}