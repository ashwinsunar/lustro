import { LayoutGrid, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SortOption } from '../../types';

interface WatchSortBarProps {
  total: number;
  sort: SortOption;
  view: 'grid' | 'list';
  onSortChange: (sort: SortOption) => void;
  onViewChange: (view: 'grid' | 'list') => void;
  className?: string;
}

export function WatchSortBar({ total, sort, view, onSortChange, onViewChange, className }: WatchSortBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b luxury-border mb-8 gap-4", className)}>
      <div className="text-sm text-white/60 font-space tracking-widest uppercase">
        <span className="text-white font-medium">{total}</span> timepieces found
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs text-white/40 uppercase tracking-widest font-space">Sort By</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-sm text-white border-b border-white/20 pb-1 focus:outline-none focus:border-gold transition-colors font-space tracking-wider cursor-pointer"
          >
            <option value="newest" className="bg-zinc-900">Newest Arrivals</option>
            <option value="price_asc" className="bg-zinc-900">Price: Low to High</option>
            <option value="price_desc" className="bg-zinc-900">Price: High to Low</option>
            <option value="rating" className="bg-zinc-900">Top Rated</option>
            <option value="popularity" className="bg-zinc-900">Most Popular</option>
            <option value="alphabetical" className="bg-zinc-900">A - Z</option>
          </select>
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-6 hidden sm:flex">
          <button
            onClick={() => onViewChange('grid')}
            className={cn("p-1.5 transition-colors", view === 'grid' ? "text-gold" : "text-white/40 hover:text-white")}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={cn("p-1.5 transition-colors", view === 'list' ? "text-gold" : "text-white/40 hover:text-white")}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
