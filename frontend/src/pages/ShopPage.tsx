import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Container } from '../components/layout';
import { WatchGrid, WatchFilters, WatchSortBar } from '../components/watch';
import { Button } from '../components/ui';
import { fetchWatches } from '../services/watches';
import { fetchBrands } from '../services/brands';
import { fetchCategories } from '../services/categories';
import type { WatchFilters as IWatchFilters, SortOption } from '../types';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [debouncedPrice, setDebouncedPrice] = useState<{min: number, max: number} | null>(null);

  // Parse filters from URL
  const filters: IWatchFilters = {
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    movements: searchParams.get('movements')?.split(',').filter(Boolean) || [],
    genders: searchParams.get('genders')?.split(',').filter(Boolean) || [],
    minPrice: parseInt(searchParams.get('minPrice') || '0', 10),
    maxPrice: parseInt(searchParams.get('maxPrice') || '100000', 10),
    inStockOnly: searchParams.get('inStockOnly') === 'true',
    onSaleOnly: searchParams.get('onSaleOnly') === 'true',
    search: searchParams.get('search') || '',
    sort: (searchParams.get('sort') as SortOption) || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
    view: (searchParams.get('view') as 'grid' | 'list') || 'grid',
  };

  // Queries
  const { data: watchesData, isLoading: loadingWatches } = useQuery({
    queryKey: ['watches', filters],
    queryFn: () => fetchWatches(filters),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const watches = watchesData?.results || [];
  const total = watchesData?.count || watches.length || 0;

  // Debounce price changes before updating URL
  useEffect(() => {
    if (debouncedPrice) {
      const timer = setTimeout(() => {
        handleFilterChange({ ...filters, minPrice: debouncedPrice.min, maxPrice: debouncedPrice.max });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [debouncedPrice]);

  const handleFilterChange = (newFilters: IWatchFilters) => {
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

    setSearchParams(params);
  };

  // Pre-process filters for WatchFilters component (handle local price debounce)
  const displayFilters = {
    ...filters,
    minPrice: debouncedPrice?.min ?? filters.minPrice,
    maxPrice: debouncedPrice?.max ?? filters.maxPrice,
  };

  const onFiltersChange = (newF: IWatchFilters) => {
    if (newF.minPrice !== displayFilters.minPrice || newF.maxPrice !== displayFilters.maxPrice) {
      setDebouncedPrice({ min: newF.minPrice, max: newF.maxPrice });
    } else {
      handleFilterChange(newF);
    }
  };

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container>
        {/* Header */}
        <div className="mb-12">
          <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
            Home / Collections
          </div>
          <h1 className="text-4xl md:text-5xl font-light">The Collections</h1>
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
              onSortChange={(sort) => handleFilterChange({ ...filters, sort })}
              onViewChange={(view) => handleFilterChange({ ...filters, view })}
            />

            <WatchGrid 
              watches={watches}
              isLoading={loadingWatches}
              columns={filters.view === 'list' ? 2 : 3} // We don't have list view implemented in grid yet, but we pass columns
            />

            {/* Pagination Controls */}
            {total > 0 && Math.ceil(total / 12) > 1 && (
              <div className="mt-16 flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  disabled={filters.page === 1}
                  onClick={() => handleFilterChange({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 font-space text-sm">
                  Page {filters.page} of {Math.ceil(total / 12)}
                </span>
                <Button 
                  variant="outline"
                  disabled={filters.page >= Math.ceil(total / 12)}
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
