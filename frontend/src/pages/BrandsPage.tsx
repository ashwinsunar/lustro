import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { Container } from '../components/layout';
import { WatchCardSkeleton } from '../components/watch';
import { fetchBrands } from '../services/brands';
import { usePageMeta } from '../hooks/usePageMeta';

export default function BrandsPage() {
  const { data: brands = [], isLoading } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });

  usePageMeta({
    title: 'Our Maisons',
    description: 'Ten of horology\u2019s most storied names — Rolex, Omega, Patek Philippe and more — curated for Lustro.',
    path: '/brands',
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container>
        <div className="mb-12">
          <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
            Home / Brands
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-medium">Our Maisons</h1>
          <p className="text-white/50 mt-4 max-w-xl font-light">
            Ten of horology's most storied names, curated for Lustro.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <WatchCardSkeleton key={i} className="h-56" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                to={`/brands/${brand.slug}`}
                className="group border border-white/5 bg-zinc-900/40 p-8 hover:border-gold/40 hover:bg-zinc-900/70 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-light group-hover:text-gold transition-colors">
                    {brand.name}
                  </h2>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
                  {brand.country || 'Switzerland'} · Est. {brand.founded_year ?? '—'}
                </p>
                <p className="text-white/50 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                  {brand.description || 'No description available.'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-space tracking-widest uppercase text-white/40">
                    {brand.watch_count ?? 0} timepieces
                  </span>
                  <span className="text-xs font-space tracking-widest uppercase text-gold">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}