import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Container } from './Container';
import api from '../../services/api';

const SOCIALS = [
  { name: 'Instagram', handle: 'IG', href: 'https://instagram.com' },
  { name: 'Twitter / X', handle: 'TW', href: 'https://x.com' },
  { name: 'Facebook', handle: 'FB', href: 'https://facebook.com' },
  { name: 'YouTube', handle: 'YT', href: 'https://youtube.com' },
];

const EXPLORE_LINKS = [
  { name: 'All Collections', path: '/shop' },
  { name: 'New Arrivals', path: '/shop?new_arrival=true' },
  { name: 'Trending Now', path: '/shop?trending=true' },
  { name: 'Wishlist', path: '/wishlist' },
  { name: 'Compare', path: '/compare' },
];

const BRAND_LINKS = ['Rolex', 'Omega', 'TAG Heuer', 'Patek Philippe', 'IWC', 'Breitling'];

const COMPANY_LINKS = [
  { name: 'About Us', path: '/legacy' },
  { name: 'The Boutique', path: '/brands' },
  { name: 'Contact', path: 'mailto:concierge@lustro.ch' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || loading) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/auth/newsletter/', { email: value, source: 'footer' });
      toast.success(data.detail || 'Welcome to the Lustro list.');
      setEmail('');
    } catch {
      toast.error('We could not subscribe you. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-zinc-950 border-t border-white/5 pt-20 pb-10">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Col 1: Brand */}
          <div className="space-y-6">
            <Link to="/" className="text-3xl font-space font-bold tracking-[0.2em] text-gold">
              LUSTRO
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Curating the world's most exceptional timepieces for those who appreciate the extraordinary.
            </p>
            <form onSubmit={subscribe} className="max-w-xs">
              <label htmlFor="newsletter" className="block text-xs font-space tracking-widest uppercase text-white/50 mb-3">
                Private dispatches
              </label>
              <div className="flex items-center border border-white/15 focus-within:border-gold/60 transition-colors">
                <input
                  id="newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Subscribe to newsletter"
                  className="px-4 py-3 text-gold hover:text-white transition-colors disabled:opacity-40"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
            <div className="flex gap-4">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="text-white/40 hover:text-gold transition-colors text-sm tracking-widest uppercase font-space"
                >
                  {social.handle}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Collections */}
          <div>
            <h4 className="font-space tracking-widest uppercase text-sm mb-6 text-white">Explore</h4>
            <ul className="space-y-4">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/60 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Brands */}
          <div>
            <h4 className="font-space tracking-widest uppercase text-sm mb-6 text-white">Brands</h4>
            <ul className="space-y-4">
              {BRAND_LINKS.map((brand) => (
                <li key={brand}>
                  <Link
                    to={`/brands/${brand.toLowerCase().replace(' ', '-')}`}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Company */}
          <div>
            <h4 className="font-space tracking-widest uppercase text-sm mb-6 text-white">Company</h4>
            <ul className="space-y-4">
              {COMPANY_LINKS.map((link) => (
                <li key={link.name}>
                  {link.path.startsWith('/') ? (
                    <Link to={link.path} className="text-white/60 hover:text-white transition-colors text-sm">
                      {link.name}
                    </Link>
                  ) : (
                    <a href={link.path} className="text-white/60 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t luxury-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs font-space tracking-widest text-center md:text-left">
            &copy; {new Date().getFullYear()} LUSTRO. CRAFTED FOR THE EXTRAORDINARY.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-white/40 text-xs font-space tracking-widest">SECURE PAYMENTS</span>
            <div className="flex gap-2">
              <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] text-white/50">COD</div>
              <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] text-white/50">CARD</div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}