import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, User as UserIcon, Heart, LogOut, Package } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useSearchStore } from '../store/searchStore';
import { cn, getImageUrl } from '../lib/utils';
import { Container } from './layout';
import { fetchCategories } from '../services/categories';
import api from '../services/api';
import type { WatchListItem, Category } from '../types';

const CATEGORY_ORDER = ['dress', 'sport', 'dive', 'pilot', 'chronograph', 'gmt'];

function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { totalItems } = useCartStore();
  const { count: wishlistCount } = useWishlistStore();
  const { isAuthenticated, logout, user } = useAuthStore();
  const { isSearchOpen, openSearch, closeSearch, query, setQuery } = useSearchStore();

  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useBodyLock(isMobileMenuOpen || isSearchOpen);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCollectionsOpen(false);
    setIsUserMenuOpen(false);
    closeSearch();
  }, [location.pathname, closeSearch]);

  // Focus search input when open
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isSearchOpen]);

  // Close overlays on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (isSearchOpen) {
        closeSearch();
        searchButtonRef.current?.focus();
      }
      setIsCollectionsOpen(false);
      setIsUserMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen, isSearchOpen, closeSearch]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const submitSearch = (term?: string) => {
    const q = (term ?? query).trim();
    closeSearch();
    if (q) navigate(`/shop?search=${encodeURIComponent(q)}`);
  };

  // Real catalog imagery for the collection mega menu — one request, cached,
  // fetched only when the menu is opened.
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
  const { data: menuWatches = [] } = useQuery({
    queryKey: ['navbar', 'watches'],
    queryFn: async () => {
      const { data } = await api.get<{ results: WatchListItem[] }>('/api/v1/watches/?page_size=100');
      return data.results || [];
    },
    staleTime: 10 * 60 * 1000,
    enabled: isCollectionsOpen,
  });

  const categoryCover = (slug: string): string | undefined => {
    const watch = menuWatches.find(
      (w) => w.category?.slug === slug && w.images?.length
    );
    if (!watch) return undefined;
    return getImageUrl(watch.images.find((i) => i.is_primary)?.image || watch.images[0].image);
  };

  const sortedCategories = [...categories].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug)
  );

  const collections = sortedCategories.map((cat: Category) => ({
    name: cat.name,
    slug: cat.slug,
    image: categoryCover(cat.slug),
    count: cat.watch_count ?? 0,
  }));

  const isShop = location.pathname === '/shop';
  const isBrands = location.pathname === '/brands';
  const isNewArrivals = new URLSearchParams(location.search).get('new_arrival') === 'true';

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          isScrolled || isMobileMenuOpen || isCollectionsOpen
            ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 py-4'
            : 'bg-transparent py-6'
        )}
      >
        <Container className="flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 lg:hidden w-1/3">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-white p-2 -ml-2"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Links (Left) */}
          <div className="hidden lg:flex items-center gap-8 w-1/3">
            <div
              className="relative"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <button
                className="text-xs font-space tracking-widest uppercase text-white/80 hover:text-gold transition-colors py-4"
                aria-expanded={isCollectionsOpen}
                aria-haspopup="true"
              >
                Collections
              </button>

              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {isCollectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 w-[720px] bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-1 p-1 bg-white/5">
                      {collections.map((col) => (
                        <Link
                          key={col.slug}
                          to={`/shop?category=${col.slug}`}
                          className="group relative block aspect-[3/4] overflow-hidden bg-zinc-900"
                        >
                          {col.image ? (
                            <img
                              src={col.image}
                              alt={col.name}
                              loading="lazy"
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center font-display text-2xl text-white/25">
                              {col.name}
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <span className="text-[10px] font-space tracking-widest uppercase text-white group-hover:text-gold transition-colors">
                              {col.name} {col.count > 0 && `· ${col.count}`}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="p-4 bg-zinc-950 text-center">
                      <Link to="/shop" className="text-xs font-space tracking-widest uppercase text-gold hover:text-white transition-colors">
                        View All Collections →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/shop" className={`text-xs font-space tracking-widest uppercase transition-colors relative group ${isShop ? 'text-gold' : 'text-white/80 hover:text-gold'}`}>
              All Pieces
              <span className={`absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300 ${isShop ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </Link>
            <Link to="/shop?new_arrival=true" className={`text-xs font-space tracking-widest uppercase transition-colors relative group ${isNewArrivals ? 'text-gold' : 'text-white/80 hover:text-gold'}`}>
              New Arrivals
              <span className={`absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300 ${isNewArrivals ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </Link>
            <Link to="/brands" className={`text-xs font-space tracking-widest uppercase transition-colors relative group ${isBrands ? 'text-gold' : 'text-white/80 hover:text-gold'}`}>
              Brands
              <span className={`absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300 ${isBrands ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </Link>
          </div>

          {/* Logo (Center) */}
          <div className="w-1/3 flex justify-center">
            <Link to="/" className="flex items-center transition-opacity hover:opacity-80" aria-label="Lustro home">
              <img src="/logo.png" alt="Lustro" className="h-10 md:h-12 w-auto" />
            </Link>
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center justify-end gap-5 w-1/3">
            <button ref={searchButtonRef} onClick={openSearch} className="text-white/80 hover:text-gold transition-colors" aria-label="Search">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {isAuthenticated() ? (
              <div
                className="relative hidden lg:block"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button className="text-white/80 hover:text-gold transition-colors py-4" aria-label="Account menu" aria-expanded={isUserMenuOpen}>
                  <UserIcon className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 w-48 bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden py-2"
                    >
                      <div className="px-4 py-2 border-b border-white/5 mb-2">
                        <p className="text-xs text-white/50 font-space tracking-widest uppercase mb-1">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user?.first_name}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors">
                        <UserIcon className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/profile/orders" className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors">
                        <Package className="w-4 h-4" /> Orders
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left mt-2 border-t border-white/5 pt-3">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:block text-white/80 hover:text-gold transition-colors" aria-label="Sign in">
                <UserIcon className="w-5 h-5" strokeWidth={1.5} />
              </Link>
            )}

            <Link to="/wishlist" className="hidden sm:block text-white/80 hover:text-gold transition-colors relative" aria-label="Wishlist">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              {wishlistCount() > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-gold text-black text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center font-space">
                  {wishlistCount()}
                </span>
              )}
            </Link>

            <Link to="/cart" className="text-white/80 hover:text-gold transition-colors relative" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              {totalItems() > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-gold text-black text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center font-space">
                  {totalItems()}
                </span>
              )}
            </Link>
          </div>
        </Container>
      </nav>

      {/* Full Screen Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Search the collection"
          >
            <div className="container mx-auto px-6 pt-10 pb-6 flex justify-end">
              <button onClick={closeSearch} className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-xs font-space tracking-widest uppercase">
                Close <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 container mx-auto px-6 max-w-4xl flex flex-col items-center pt-20">
              <div className="w-full relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-white/30" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitSearch();
                  }}
                  placeholder="Search timepieces, brands..."
                  className="w-full bg-transparent border-b-2 border-white/20 pb-4 pl-12 text-3xl md:text-5xl font-light text-white placeholder:text-white/20 focus:outline-none focus:border-gold transition-colors font-space"
                />
              </div>

              {/* Search Suggestions */}
              <div className="w-full mt-16 text-left">
                <p className="text-xs font-space tracking-widest uppercase text-white/40 mb-6">Popular Searches</p>
                <div className="flex flex-wrap gap-4">
                  {['Rolex Daytona', 'Omega Speedmaster', 'Dive Watches', 'GMT', 'Patek Philippe Nautilus'].map(term => (
                    <button key={term} onClick={() => submitSearch(term)} className="px-6 py-3 border border-white/10 rounded-full text-sm hover:border-gold hover:text-gold transition-colors">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <img src="/logo.png" alt="Lustro" className="h-9 w-auto" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2" aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 text-2xl font-light">
              <Link to="/shop" className="hover:text-gold transition-colors">All Collections</Link>
              <Link to="/shop?new_arrival=true" className="hover:text-gold transition-colors">New Arrivals</Link>
              <Link to="/shop?trending=true" className="hover:text-gold transition-colors">Trending Now</Link>
              <Link to="/brands" className="hover:text-gold transition-colors">Our Brands</Link>

              <div className="border-t border-white/10 pt-8 mt-4 flex flex-col gap-6 text-lg">
                <div className="flex flex-col gap-4 text-base text-white/60">
                  {sortedCategories.map((cat) => (
                    <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="hover:text-gold transition-colors">
                      {cat.name} Watches
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-8 mt-4 flex flex-col gap-6 text-lg">
                {isAuthenticated() ? (
                  <>
                    <Link to="/profile" className="flex items-center gap-4 text-white/80 hover:text-white"><UserIcon className="w-5 h-5"/> My Account</Link>
                    <Link to="/wishlist" className="flex items-center gap-4 text-white/80 hover:text-white"><Heart className="w-5 h-5"/> Wishlist ({wishlistCount()})</Link>
                    <button onClick={handleLogout} className="flex items-center gap-4 text-destructive text-left"><LogOut className="w-5 h-5"/> Sign Out</button>
                  </>
                ) : (
                  <Link to="/login" className="flex items-center gap-4 text-white/80 hover:text-white"><UserIcon className="w-5 h-5"/> Sign In / Register</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
