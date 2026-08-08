import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, X, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Container } from '../components/layout';
import { WatchGrid, WatchFilters, WatchSortBar } from '../components/watch';
import { Button } from '../components/ui';
import { fetchWatches } from '../services/watches';
import { fetchBrands } from '../services/brands';
import { fetchCategories } from '../services/categories';
import { usePageMeta } from '../hooks/usePageMeta';
import type { WatchFilters as IWatchFilters, SortOption } from '../types';

export default function ShopPage() {
  usePageMeta({
    title: 'The Collections',
    description: 'Browse the Lustro collection — dress, sport, dive, pilot, chronograph and GMT timepieces from Rolex, Omega, Patek Philippe and more.',
    path: '/shop',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [debouncedPrice, setDebouncedPrice] = useState<{min: number, max: number} | null>(null);
  const filtersRef = useRef<IWatchFilters | null>(null);

  const parseIntSafe = (value: string | null, fallback: number): number => {
    const n = parseInt(value || '', 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const categoryParam = searchParams.get('category');
  const presetCategories = categoryParam ? [categoryParam] : [];

  // Parse filters from URL
  const filters: IWatchFilters = {
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || presetCategories,
    movements: searchParams.get('movements')?.split(',').filter(Boolean) || [],
    genders: searchParams.get('genders')?.split(',').filter(Boolean) || [],
    minPrice: parseIntSafe(searchParams.get('minPrice'), 0),
    maxPrice: parseIntSafe(searchParams.get('maxPrice'), 100000),
    inStockOnly: searchParams.get('inStockOnly') === 'true',
    onSaleOnly: searchParams.get('onSaleOnly') === 'true',
    search: searchParams.get('search') || '',
    sort: (searchParams.get('sort') as SortOption) || 'newest',
    page: Math.max(1, parseIntSafe(searchParams.get('page'), 1)),
    view: (searchParams.get('view') as 'grid' | 'list') || 'grid',
    newArrival: searchParams.get('new_arrival') === 'true',
    trending: searchParams.get('trending') === 'true',
    featured: searchParams.get('featured') === 'true' || searchParams.get('is_featured') === 'true',
    bestSeller: searchParams.get('best_seller') === 'true',
  };

  filtersRef.current = filters;

  // Queries
  const { data: watchesData, isLoading: loadingWatches, isError, refetch } = useQuery({
    queryKey: ['watches', filters],
    queryFn: () => fetchWatches(filters),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const watches = watchesData?.results || [];
  const total = watchesData?.count || watches.length || 0;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const handleFilterChange = useCallback((newFilters: IWatchFilters) => {
    const params = new URLSearchParams();

    if (newFilters.brands.length) params.set('brands', newFilters.brands.join(','));
    if (newFilters.categories.length) params.set('categories', newFilters.categories.join(','));
    if (newFilters.movements.length) params.set('movements', newFilters.movements.join(','));
    if (newFilters.genders.length) params.set('genders', newFilters.genders.join(','));
    if (newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice < 100000) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.inStockOnly) params.set('inStockOnly', 'true');
    if (newFilters.onSaleOnly) params.set('onSaleOnly', 'true');
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.view !== 'grid') params.set('view', newFilters.view);
    if (newFilters.newArrival) params.set('new_arrival', 'true');
    if (newFilters.trending) params.set('trending', 'true');
    if (newFilters.featured) params.set('featured', 'true');
    if (newFilters.bestSeller) params.set('best_seller', 'true');

    setSearchParams(params);
  }, [setSearchParams]);

  // Debounce price changes before updating URL — always merge into the latest
  // filter state so other pending edits are never lost.
  useEffect(() => {
    if (debouncedPrice) {
      const timer = setTimeout(() => {
        const current = filtersRef.current;
        if (current) {
          handleFilterChange({
            ...current,
            minPrice: debouncedPrice.min,
            maxPrice: debouncedPrice.max,
            page: 1,
          });
        }
        setDebouncedPrice(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [debouncedPrice, handleFilterChange]);

  // Pre-process filters for WatchFilters component (handle local price debounce)
  const displayFilters = {
    ...filters,
    minPrice: debouncedPrice?.min ?? filters.minPrice,
    maxPrice: debouncedPrice?.max ?? filters.maxPrice,
  };

  const onFiltersChange = (newF: IWatchFilters) => {
    if (newF.minPrice !== filters.minPrice || newF.maxPrice !== filters.maxPrice) {
      setDebouncedPrice({ min: newF.minPrice, max: newF.maxPrice });
    } else {
      handleFilterChange(newF);
    }
  };

  const hasNext = !!watchesData?.next;
  const hasPrev = !!watchesData?.previous;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container>
        {/* Header */}
        <div className="mb-12">
          <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
            Home / Collections
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-medium">The Collections</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 relative">

          {/* Mobile Filter Button (Sticky Bottom) */}
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <Button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="rounded-full shadow-2xl px-8 flex items-center gap-3"
            >
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </div>

          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-32">
              <WatchFilters
                filters={displayFilters}
                onChange={onFiltersChange}
                brands={brands}
                categories={categories}
              />
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isMobileFiltersOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 lg:hidden"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-zinc-950 border-r border-white/10 flex flex-col"
                >
                  <div className="p-6 flex justify-between items-center border-b border-white/10">
                    <h2 className="font-space uppercase tracking-widest">Filters</h2>
                    <button onClick={() => setIsMobileFiltersOpen(false)} className="text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden p-6">
                    <WatchFilters
                      filters={displayFilters}
                      onChange={onFiltersChange}
                      brands={brands}
                      categories={categories}
                    />
                  </div>
                  <div className="p-6 border-t border-white/10 bg-zinc-950">
                    <Button onClick={() => setIsMobileFiltersOpen(false)} className="w-full">
                      View {total} Results
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <WatchSortBar
              total={total}
              sort={filters.sort}
              view={filters.view}
              onSortChange={(sort) => handleFilterChange({ ...filters, sort, page: 1 })}
              onViewChange={(view) => handleFilterChange({ ...filters, view })}
            />

            {isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 bg-zinc-900/30">
                <p className="text-white/60 mb-8">We couldn't load the collection right now.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Try again
                </Button>
              </div>
            ) : (
              <WatchGrid
                watches={watches}
                isLoading={loadingWatches}
                variant={filters.view}
              />
            )}

            {/* Pagination Controls */}
            {!isError && total > 0 && totalPages > 1 && (
              <div className="mt-16 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={!hasPrev}
                  onClick={() => handleFilterChange({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 font-space text-sm">
                  Page {filters.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!hasNext}
                  onClick={() => handleFilterChange({ ...filters, page: filters.page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}