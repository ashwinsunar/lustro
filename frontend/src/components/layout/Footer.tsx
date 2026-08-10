import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Instagram, Mail } from 'lucide-react';
import { Container } from './Container';
import api from '../../services/api';
import { fetchBrands } from '../../services/brands';
import type { Brand } from '../../types';

const SOCIALS = [
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/10m_ashwin2' },
  { name: 'Email', icon: Mail, href: 'mailto:ashwinsunar18@gmail.com' },
];

const EXPLORE_LINKS = [
  { name: 'All Collections', path: '/shop' },
  { name: 'New Arrivals', path: '/shop?new_arrival=true' },
  { name: 'Trending Now', path: '/shop?trending=true' },
  { name: 'Wishlist', path: '/wishlist' },
  { name: 'Compare', path: '/compare' },
];

const COMPANY_LINKS = [
  { name: 'Our Story', path: '/' },
  { name: 'The Collection', path: '/shop' },
  { name: 'Concierge', path: 'mailto:ashwinsunar18@gmail.com' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ['brands'], queryFn: fetchBrands });

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
                  className="text-white/40 hover:text-gold transition-colors"
                >
                  <social.icon className="w-5 h-5" />
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
              {brands.slice(0, 6).map((brand) => (
                <li key={brand.id}>
                  <Link
                    to={`/brands/${brand.slug}`}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {brand.name}
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
            <span className="text-white/30 text-xs font-space tracking-widest">VISA · MASTERCARD · AMEX</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}