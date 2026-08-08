import * as React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { ChevronDown, Check } from 'lucide-react';
import { cn, formatPrice } from '../../lib/utils';
import type { Brand, Category, WatchFilters as IWatchFilters } from '../../types';

interface WatchFiltersProps {
  filters: IWatchFilters;
  onChange: (filters: IWatchFilters) => void;
  brands: Brand[];
  categories: Category[];
  className?: string;
}

export function WatchFilters({ filters, onChange, brands, categories, className }: WatchFiltersProps) {
  const [pricePreview, setPricePreview] = React.useState<[number, number] | null>(null);

  const handleCheckboxChange = (group: 'brands' | 'categories' | 'movements' | 'genders', value: string) => {
    const current = filters[group];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    onChange({ ...filters, [group]: updated, page: 1 });
  };

  const handleToggleChange = (key: 'inStockOnly' | 'onSaleOnly') => {
    onChange({ ...filters, [key]: !filters[key], page: 1 });
  };

  const handlePriceChange = (value: number[]) => {
    setPricePreview(null);
    onChange({ ...filters, minPrice: value[0], maxPrice: value[1], page: 1 });
  };

  const shownMin = pricePreview?.[0] ?? filters.minPrice;
  const shownMax = pricePreview?.[1] ?? filters.maxPrice;

  const clearAll = () => {
    onChange({
      brands: [],
      categories: [],
      movements: [],
      genders: [],
      minPrice: 0,
      maxPrice: 100000,
      inStockOnly: false,
      onSaleOnly: false,
      search: filters.search,
      sort: filters.sort,
      page: 1,
      view: filters.view
    });
  };

  const activeCount = filters.brands.length + filters.categories.length + filters.movements.length + filters.genders.length + (filters.inStockOnly ? 1 : 0) + (filters.onSaleOnly ? 1 : 0) + (filters.minPrice > 0 || filters.maxPrice < 100000 ? 1 : 0);

  return (
    <div className={cn("w-full bg-zinc-950 flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-space uppercase tracking-widest flex items-center gap-2">
          Filters 
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-gold text-black text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-white/50 hover:text-gold uppercase tracking-widest transition-colors font-space">
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {/* Price Range */}
        <FilterSection title="Price Range" defaultOpen>
          <div className="px-2 pt-4 pb-2">
            <Slider.Root
              key={`${filters.minPrice}-${filters.maxPrice}`}
              className="relative flex items-center select-none touch-none w-full h-5 mb-6"
              defaultValue={[filters.minPrice, filters.maxPrice]}
              max={100000}
              step={100}
              onValueChange={(value) => setPricePreview([value[0], value[1]])}
              onValueCommit={handlePriceChange}
              aria-label="Price range"
            >
              <Slider.Track className="bg-white/10 relative grow rounded-full h-[2px]">
                <Slider.Range className="absolute bg-gold rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-gold rounded-full shadow-[0_2px_10px] shadow-blackA4 focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-grab active:cursor-grabbing" />
              <Slider.Thumb className="block w-4 h-4 bg-gold rounded-full shadow-[0_2px_10px] shadow-blackA4 focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-grab active:cursor-grabbing" />
            </Slider.Root>
            <div className="flex items-center justify-between text-xs font-space tracking-wider text-white/60">
              <span>{formatPrice(shownMin)}</span>
              <span>{formatPrice(shownMax)}+</span>
            </div>
          </div>
        </FilterSection>

        {/* Brands */}
        <FilterSection title="Brands" defaultOpen>
          <div className="space-y-3">
            {brands.map((brand) => (
              <CheckboxItem 
                key={brand.slug}
                label={brand.name}
                checked={filters.brands.includes(brand.slug)}
                onChange={() => handleCheckboxChange('brands', brand.slug)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Categories */}
        <FilterSection title="Categories">
          <div className="space-y-3">
            {categories.map((cat) => (
              <CheckboxItem 
                key={cat.slug}
                label={cat.name}
                checked={filters.categories.includes(cat.slug)}
                onChange={() => handleCheckboxChange('categories', cat.slug)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Movements */}
        <FilterSection title="Movement">
          <div className="space-y-3">
            {[
              { id: 'automatic', label: 'Automatic' },
              { id: 'manual', label: 'Manual Winding' },
              { id: 'quartz', label: 'Quartz' },
              { id: 'spring_drive', label: 'Spring Drive' },
            ].map((mov) => (
              <CheckboxItem 
                key={mov.id}
                label={mov.label}
                checked={filters.movements.includes(mov.id)}
                onChange={() => handleCheckboxChange('movements', mov.id)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Availability / Other toggles */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <ToggleItem 
            label="In Stock Only"
            checked={filters.inStockOnly}
            onChange={() => handleToggleChange('inStockOnly')}
          />
          <ToggleItem 
            label="Sale Items Only"
            checked={filters.onSaleOnly}
            onChange={() => handleToggleChange('onSaleOnly')}
          />
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <div className="border-b border-white/5 pb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-space uppercase tracking-widest text-white/80 hover:text-white transition-colors"
      >
        {title}
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
      </button>
      {isOpen && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}

function CheckboxItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-3 cursor-pointer group w-full text-left"
    >
      <span className={cn(
        "w-4 h-4 flex items-center justify-center shrink-0 transition-colors border",
        checked ? "bg-gold border-gold" : "bg-transparent border-white/20 group-hover:border-white/50"
      )}>
        {checked && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </span>
      <span className={cn(
        "text-sm transition-colors",
        checked ? "text-white font-medium" : "text-white/60 group-hover:text-white"
      )}>
        {label}
      </span>
    </button>
  );
}

function ToggleItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center justify-between cursor-pointer group w-full text-left"
    >
      <span className={cn(
        "text-sm uppercase tracking-widest font-space transition-colors",
        checked ? "text-gold" : "text-white/60 group-hover:text-white"
      )}>
        {label}
      </span>
      <span className={cn(
        "w-8 h-4 rounded-full relative transition-colors shrink-0",
        checked ? "bg-gold" : "bg-zinc-800"
      )}>
        <span className={cn(
          "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
          checked ? "left-[18px] bg-black" : "left-0.5"
        )} />
      </span>
    </button>
  );
}
