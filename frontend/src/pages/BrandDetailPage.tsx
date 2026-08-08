import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Container } from '../components/layout';
import { WatchGrid, WatchCardSkeleton } from '../components/watch';
import { Button } from '../components/ui';
import { fetchBrand } from '../services/brands';
import { fetchWatches } from '../services/watches';
import { usePageMeta } from '../hooks/usePageMeta';
import type { WatchFilters } from '../types';

export default function BrandDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: brand, isLoading: loadingBrand } = useQuery({
    queryKey: ['brand', slug],
    queryFn: () => fetchBrand(slug as string),
    enabled: !!slug,
  });

  const filters: WatchFilters = {
    brands: slug ? [slug] : [],
    categories: [],
    movements: [],
    genders: [],
    sources: [],
    minPrice: 0,
    maxPrice: 100000,
    inStockOnly: false,
    onSaleOnly: false,
    search: '',
    sort: 'newest',
    page: 1,
    view: 'grid',
  };

  const { data: watchesData, isLoading: loadingWatches, isError: watchesError, refetch } = useQuery({
    queryKey: ['watches', 'brand', slug],
    queryFn: () => fetchWatches(filters),
    enabled: !!slug,
  });

  const watches = watchesData?.results || [];

  usePageMeta({
    title: brand ? brand.name : 'Maison',
    description: brand?.description ? brand.description.slice(0, 160) : undefined,
    path: brand ? `/brands/${brand.slug}` : undefined,
  });

  if (loadingBrand) {
    return (
      <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
        <Container>
          <WatchCardSkeleton className="h-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <WatchCardSkeleton key={i} className="aspect-[3/4]" />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="pt-32 pb-32 bg-zinc-950 min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-white/60 mb-8">This maison is not in our collection.</p>
        <Link to="/brands">
          <Button variant="outline">All Brands</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container>
        <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link> /{' '}
          <Link to="/brands" className="hover:text-gold transition-colors">Brands</Link> / {brand.name}
        </div>

        <div className="border border-white/5 bg-zinc-900/40 p-10 md:p-14 mb-14">
          <h1 className="font-display text-4xl md:text-6xl font-medium mb-4">{brand.name}</h1>
          <p className="text-white/40 text-xs font-space tracking-widest uppercase mb-8">
            {brand.country || 'Switzerland'} · Est. {brand.founded_year ?? '—'} · {brand.watch_count ?? 0} timepieces
          </p>
          <p className="text-white/60 max-w-2xl font-light leading-relaxed">
            {brand.description || 'No description available.'}
          </p>
        </div>

        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-light">The Collection</h2>
          <span className="text-xs font-space tracking-widest uppercase text-white/40">
            {watches.length} pieces shown
          </span>
        </div>

        <WatchGrid
          watches={watchesError ? [] : watches}
          isLoading={loadingWatches}
          columns={3}
          skeletonCount={6}
        />

        {watchesError && (
          <div className="mt-8 flex flex-col items-center justify-center py-8 text-center border border-white/5 bg-zinc-900/30">
            <p className="text-white/60 mb-6">We couldn't load the pieces in this collection.</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Try again
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}