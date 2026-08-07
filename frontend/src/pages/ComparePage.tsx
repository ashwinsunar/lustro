import { Link } from 'react-router-dom';
import { X, Scale } from 'lucide-react';
import { Container } from '../components/layout';
import { Button } from '../components/ui';
import { useCompareStore } from '../store/compareStore';
import { getImageUrl, formatPrice } from '../lib/utils';

export default function ComparePage() {
  const { items, removeItem, clearCompare, count } = useCompareStore();
  const itemsCount = count();

  const rows: Array<[string, (item: (typeof items)[number]) => string]> = [
    ['Price', (w) => formatPrice(w.discount_price ?? w.price)],
    ['Movement', (w) => w.movement.replace('_', ' ')],
    ['Gender', (w) => w.gender],
    ['In Stock', (w) => (w.in_stock ? 'Yes' : 'No')],
    ['Rating', (w) => (parseFloat(w.rating) > 0 ? `${w.rating} (${w.review_count} reviews)` : '—')],
  ];

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container>
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
              Home / Compare
            </div>
            <h1 className="text-4xl md:text-5xl font-light">Compare Timepieces</h1>
            <p className="text-white/50 mt-3">
              {itemsCount > 0
                ? `Comparing ${itemsCount} of 3 pieces`
                : 'Select up to three pieces to compare'}
            </p>
          </div>
          {itemsCount > 0 && (
            <Button variant="outline" onClick={clearCompare}>
              Clear All
            </Button>
          )}
        </div>

        {itemsCount === 0 ? (
          <div className="text-center py-24 border border-white/5 bg-zinc-900/30">
            <Scale className="w-12 h-12 text-white/20 mx-auto mb-6" strokeWidth={1} />
            <p className="text-white/60 mb-8">
              Add pieces to compare from any product page or from the shop grid.
            </p>
            <Link to="/shop">
              <Button variant="outline">Go to the Shop</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-space tracking-widest uppercase text-white/40 p-4 w-40" />
                  {items.map((w) => (
                    <th key={w.id} className="p-4 border border-white/5 bg-zinc-900/40 relative min-w-[200px]">
                      <button
                        onClick={() => removeItem(w.id)}
                        className="absolute top-2 right-2 text-white/40 hover:text-destructive transition-colors"
                        aria-label={`Remove ${w.title}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Link to={`/brands/${w.brand.slug}`} className="text-[10px] font-space tracking-[0.2em] text-gold uppercase hover:text-white transition-colors block mb-2">
                        {w.brand.name}
                      </Link>
                      <Link to={`/watch/${w.slug}`} className="text-lg font-light text-white hover:text-gold transition-colors block mb-4">
                        {w.title}
                      </Link>
                      <div className="aspect-[3/4] bg-zinc-900 overflow-hidden mb-4">
                        <img
                          src={getImageUrl(w.images?.find((i) => i.is_primary)?.image || w.images?.[0]?.image)}
                          alt={w.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (
                  <tr key={label}>
                    <td className="p-4 text-xs font-space tracking-widest uppercase text-white/40 border border-white/5">
                      {label}
                    </td>
                    {items.map((w) => (
                      <td key={w.id} className="p-4 text-sm text-white/80 border border-white/5 capitalize">
                        {get(w)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4" />
                  {items.map((w) => (
                    <td key={w.id} className="p-4 border border-white/5">
                      <Link to={`/watch/${w.slug}`}>
                        <Button className="w-full">View Details</Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}