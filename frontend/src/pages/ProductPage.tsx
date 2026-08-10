import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Minus, Plus, Heart, Truck, ShieldCheck, RotateCcw, Star, Check, BadgeCheck, Bell, Loader2, Link2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

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
import { usePageMeta } from '../hooks/usePageMeta';
import { injectJsonLd, removeJsonLd } from '../lib/seo';
import { cn, getImageUrl, formatPrice, getDiscountPercent, formatDate } from '../lib/utils';
import type { Review } from '../types';

const SITE_ORIGIN = 'https://lustro.vercel.app';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  usePageMeta({
    title: watch ? watch.title : 'Timepiece',
    description: watch
      ? `${watch.title} — ${watch.brand.name}. ${watch.movement.replace('_', ' ')} movement, ${watch.case_size} case, ${watch.water_resistance} water resistance. ${formatPrice(watch.discount_price ?? watch.price)}.`
      : undefined,
    path: watch ? `/watch/${watch.slug}` : undefined,
    type: 'product',
  });

  // Product structured data (JSON-LD)
  const images = watch?.images?.length ? watch.images : [];

  useEffect(() => {
    if (!watch) return;
    const primaryImage = watch.images?.find((i) => i.is_primary)?.image || watch.images?.[0]?.image;
    injectJsonLd('product-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: watch.title,
      sku: watch.reference_number,
      description: watch.description,
      brand: { '@type': 'Brand', name: watch.brand.name },
      category: watch.category?.name,
      image: primaryImage ? getImageUrl(primaryImage) : undefined,
      offers: {
        '@type': 'Offer',
        url: `${SITE_ORIGIN}/watch/${watch.slug}`,
        priceCurrency: 'NPR',
        price: watch.discount_price ?? watch.price,
        availability: watch.in_stock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      ...(parseFloat(watch.rating) > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: watch.rating,
              reviewCount: watch.review_count,
            },
          }
        : {}),
    });
    injectJsonLd('breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Collections', item: `${SITE_ORIGIN}/shop` },
        { '@type': 'ListItem', position: 3, name: watch.brand.name, item: `${SITE_ORIGIN}/brands/${watch.brand.slug}` },
        { '@type': 'ListItem', position: 4, name: watch.title, item: `${SITE_ORIGIN}/watch/${watch.slug}` },
      ],
    });
    return () => {
      removeJsonLd('product-jsonld');
      removeJsonLd('breadcrumb-jsonld');
    };
  }, [watch]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight' && images.length > 1) setActiveImage((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft' && images.length > 1) setActiveImage((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, images.length]);

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
      await createReview(slug as string, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: reviewBody.trim(),
      });
      toast.success('Thank you — your review is live.');
      setReviewRating(5);
      setReviewTitle('');
      setReviewBody('');
      refetchReviews();
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

  const availabilityLabel =
    watch.availability === 'pre_order' ? 'Pre-order'
    : watch.availability === 'out_of_stock' ? 'Out of stock'
    : watch.availability === 'in_stock' ? 'In stock'
    : null;

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
                <button
                  onClick={() => images.length > 1 && setLightboxOpen(true)}
                  disabled={images.length <= 1}
                  className={cn('w-full h-full block relative', images.length > 1 && 'cursor-zoom-in')}
                  aria-label="Open image gallery"
                >
                  <img
                    src={getImageUrl(images[activeImage]?.image)}
                    alt={watch.title}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <span className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-[10px] font-space tracking-widest uppercase text-white/80">
                      <ZoomIn className="w-3.5 h-3.5" /> {activeImage + 1} / {images.length}
                    </span>
                  )}
                </button>
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

          {/* Lightbox */}
          {lightboxOpen && images.length > 1 && (
            <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`${watch.title} gallery`}>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-xs font-space tracking-widest uppercase text-white/50">
                  {activeImage + 1} / {images.length} · {watch.title}
                </span>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="text-white/60 hover:text-white transition-colors p-2"
                  aria-label="Close gallery"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 relative flex items-center justify-center px-4">
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 md:left-8 z-10 text-white/60 hover:text-white transition-colors p-2"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <img
                  src={getImageUrl(images[activeImage]?.image)}
                  alt={watch.title}
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  className="absolute right-4 md:right-8 z-10 text-white/60 hover:text-white transition-colors p-2"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
              <div className="flex justify-center gap-3 pb-6 pt-4">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'w-14 h-14 sm:w-16 sm:h-16 overflow-hidden border transition-colors',
                      activeImage === i ? 'border-gold' : 'border-white/10 opacity-60 hover:opacity-100'
                    )}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={getImageUrl(img.image)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <Link
                to={`/brands/${watch.brand.slug}`}
                className="text-[11px] font-space tracking-[0.25em] text-gold uppercase mb-3 inline-block hover:text-white transition-colors"
              >
                {watch.brand.name} · Est. {watch.brand.founded_year ?? '—'}
              </Link>
              <h1 className="font-display text-4xl md:text-5xl font-medium mb-4">{watch.title}</h1>
              <p className="text-white/50 text-sm font-space tracking-widest uppercase mb-6">
                {watch.reference_number}
                {watch.source && (
                  <span className="ml-3 text-white/30 normal-case tracking-normal">
                    · via {watch.source.replace(/_/g, ' ')}
                    {watch.data_quality === 'flagged' && (
                      <span className="ml-2 text-amber-400/80">· flagged for review</span>
                    )}
                  </span>
                )}
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
                  <span className="text-white/40 text-sm">
                    {watch.is_new_arrival ? 'New arrival' : 'No reviews yet'}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-4 mb-3">
                {watch.discount_price ? (
                  <>
                    <span className="text-3xl font-space text-gold">{formatPrice(watch.discount_price, watch.currency)}</span>
                    <span className="text-lg font-space text-white/40 line-through">{formatPrice(watch.price, watch.currency)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-space text-white">{formatPrice(watch.price, watch.currency)}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-10 text-sm">
                {!watch.in_stock ? (
                  <>
                    <X className="w-4 h-4 text-red-400" strokeWidth={2} />
                    <span className="text-white/70">{availabilityLabel ?? 'Out of stock'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                    <span className="text-white/70">{availabilityLabel ?? 'In stock'}</span>
                    {watch.stock_count > 0 && watch.stock_count <= 5 && (
                      <span className="text-amber-400/90">· Only {watch.stock_count} left</span>
                    )}
                    <span className="text-white/40">· Ships within 24h</span>
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
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
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
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-gold/60 transition-colors"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submittingNotify}
                    >
                      {submittingNotify ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify me'}
                    </Button>
                  </form>
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
                    category: watch.category ? { id: watch.category.id, name: watch.category.name, slug: watch.category.slug } : null,
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

              <div className="flex items-center gap-8 mb-10">
                <button
                  onClick={() => {
                    const didToggle = toggleCompare({
                      id: watch.id, title: watch.title, slug: watch.slug, brand: { id: watch.brand.id, name: watch.brand.name, slug: watch.brand.slug },
                      category: watch.category ? { id: watch.category.id, name: watch.category.name, slug: watch.category.slug } : null,
                      price: watch.price, discount_price: watch.discount_price, movement: watch.movement, gender: watch.gender,
                      in_stock: watch.in_stock, is_featured: watch.is_featured, is_trending: watch.is_trending,
                      is_new_arrival: watch.is_new_arrival, is_best_seller: watch.is_best_seller,
                      rating: watch.rating, review_count: watch.review_count, images: watch.images || [],
                    });
                    if (didToggle === false && !comparing) {
                      toast.error('Comparison list is full (max 3 pieces).');
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-space tracking-widest uppercase text-white/50 hover:text-gold transition-colors"
                >
                  {comparing ? <><Check className="w-4 h-4" /> Added to compare</> : <>Compare this piece</>}
                </button>
                <span className="w-px h-4 bg-white/10" />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard.');
                    } catch {
                      toast.error('Could not copy the link.');
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-space tracking-widest uppercase text-white/50 hover:text-gold transition-colors"
                  aria-label="Copy link to this watch"
                >
                  <Link2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {/* Assurance row */}
            <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-6 mb-10">
              {[
                { icon: Truck, label: 'Complimentary shipping' },
                { icon: ShieldCheck, label: `${watch.warranty_period.replace(' Years', '-year').replace(' Year', '-year')} warranty` },
                { icon: RotateCcw, label: '14-day returns' },
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
              <h2 className="font-display text-3xl font-medium mb-2">Collector Reviews</h2>
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
            <h2 className="font-display text-3xl font-medium">From the Same Maison</h2>
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