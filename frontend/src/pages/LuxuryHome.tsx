import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Menu, X, ArrowRight, ArrowUpRight, Star, Shield, Cog,
  Activity, Droplets, BatteryCharging, Gem, Rotate3D, MousePointerClick, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCartStore } from '../store/cartStore';
import { fetchFeaturedWatches } from '../services/watches';
import api from '../services/api';
import { getImageUrl, formatPrice } from '../lib/utils';
import type { CartItem } from '../types';

const WATCH_IMG = '/images/watch-detail.avif';

const STATIC_PRODUCT: CartItem = {
  id: 1,
  title: 'Lustro Moonphase Silver',
  price: '24500',
  brandName: 'LUSTRO',
  image: WATCH_IMG,
  quantity: 1,
  slug: 'lustro-moonphase-silver',
};

const FINISHES = ['Obsidian', 'Silver', 'Gold'];

const COMPOSITION = [
  { label: 'Case', icon: Shield, body: '904L stainless steel, brushed and polished by hand in Geneva.' },
  { label: 'Movement', icon: Cog, body: 'Swiss automatic calibre, assembled and adjusted in-house.' },
  { label: 'Strap', icon: Activity, body: 'Hand-stitched leather with a deployant clasp geometry.' },
];

const FEATURES = [
  { icon: Droplets, title: '10 ATM Water Resistance', body: 'Engineered for daily wear, from boardroom to shore.' },
  { icon: BatteryCharging, title: '72-Hour Power Reserve', body: 'A full weekend off the wrist, indicated at nine o\u2019clock.' },
  { icon: Gem, title: 'Sapphire Crystal', body: 'Double-domed, anti-reflective on both sides, virtually unscratchable.' },
];

const ATELIERS = [
  { num: '01', title: 'Drawing room', body: 'Every reference begins as a full-scale study. Proportion, balance and light are resolved before a single tool touches metal.' },
  { num: '02', title: 'Case room', body: 'The case is cut in controlled passes, then refined by hand until every transition feels continuous from lug to crown.' },
  { num: '03', title: 'Finishing room', body: 'Brushed planes and polished edges are finished independently so every surface responds to light with intention.' },
  { num: '04', title: 'Assembly bench', body: 'Hundreds of components are assembled under magnification, adjusted by feel, then regulated across multiple positions.' },
];

const VOICES = [
  { quote: '“It does not ask for attention, but it rewards anyone who looks closely. That is exactly what I wanted from a daily watch.”', name: 'Julien Moreau', role: 'Architect · Paris' },
  { quote: '“The finishing feels unusually calm. Every surface has purpose, and the movement becomes more interesting the longer you live with it.”', name: 'Elena Rossi', role: 'Curator · Milan' },
  { quote: '“I expected precision. I did not expect the watch to feel this personal. The proportions, weight and sound are beautifully judged.”', name: 'David Chen', role: 'Founder · Singapore' },
];

export default function LuxuryHome() {
  const { items, addItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [finish, setFinish] = useState(FINISHES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', date: '', preference: 'Private salon, Geneva', message: '' });

  const { data: featured = [] } = useQuery({ queryKey: ['watches', 'featured'], queryFn: fetchFeaturedWatches });
  const product = featured[0];
  const productPrice = product ? product.price : STATIC_PRODUCT.price;
  const productImage = product ? getImageUrl(product.images[0]?.image) : WATCH_IMG;
  const collectionWatches = featured.length >= 3 ? featured.slice(0, 3) : featured;

  const buildCartItem = (): CartItem =>
    product
      ? {
          id: product.id,
          title: product.title,
          price: product.price,
          discount_price: product.discount_price,
          brandName: product.brand.name,
          image: productImage,
          quantity: 1,
          slug: product.slug,
        }
      : STATIC_PRODUCT;

  const handleAdd = () => addItem(buildCartItem());

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openProduct = (slug: string) => navigate(`/watch/${slug}`);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/chat/appointments/', form);
      toast.success('Appointment request received — our boutique will confirm shortly.');
      setReserveOpen(false);
      setForm({ full_name: '', email: '', date: '', preference: 'Private salon, Geneva', message: '' });
    } catch {
      toast.error('Could not send the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white antialiased selection:bg-white/20 selection:text-white bg-grid overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
        <button onClick={() => scrollTo('top')} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-sm font-medium tracking-tight text-white/90">LUSTRO</span>
        </button>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400 tracking-wide">
          <button onClick={() => scrollTo('collection')} className="hover:text-white transition-colors">COLLECTION</button>
          <button onClick={() => scrollTo('craft')} className="hover:text-white transition-colors">CRAFTSMANSHIP</button>
          <button onClick={() => scrollTo('calibre')} className="hover:text-white transition-colors">THE WATCH</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="group hidden md:flex items-center gap-2 bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-zinc-200 transition-all duration-300" onClick={() => setReserveOpen(true)}>
            <span>RESERVE</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#030304]/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 md:hidden">
          <button onClick={() => scrollTo('collection')} className="text-2xl font-medium tracking-tight text-white">Collection</button>
          <button onClick={() => scrollTo('craft')} className="text-2xl font-medium tracking-tight text-white">Craftsmanship</button>
          <button onClick={() => scrollTo('calibre')} className="text-2xl font-medium tracking-tight text-white">The Watch</button>
          <button onClick={() => { setMenuOpen(false); setReserveOpen(true); }} className="mt-4 bg-white text-black px-6 py-2 rounded text-xs font-medium">RESERVE</button>
        </div>
      )}

      <main className="relative z-10 w-full">
        {/* ============ HERO ============ */}
        <section id="top" className="h-screen w-full flex flex-col justify-center items-start px-6 md:px-24">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Manufacture · Since 1948</span>
            </div>

            <h1 className="text-7xl md:text-9xl font-medium tracking-tighter leading-[0.9] text-white">
              LUSTRO
              <br />
              <span className="text-zinc-700">GENÈVE.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 max-w-sm font-light leading-relaxed tracking-tight">
              Mechanical watches assembled, finished and adjusted in Geneva. Precision shaped by time.
            </p>

            <div className="pt-8 flex items-center gap-6 text-zinc-500 text-xs tracking-wide">
              <div className="flex items-center gap-2">
                <Rotate3D size={16} />
                <span>INTERACT</span>
              </div>
              <div className="h-px w-8 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <MousePointerClick size={16} />
                <span>SCROLL</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ COMPOSITION ============ */}
        <section id="calibre" className="min-h-screen w-full flex items-center justify-end px-6 md:px-24 py-24">
          <div className="w-full max-w-sm space-y-6 glass-panel p-8 rounded-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h2 className="text-2xl font-medium tracking-tight text-white">Composition</h2>
              <span className="text-xs text-zinc-500 font-mono">CAL-72</span>
            </div>

            <div className="space-y-6">
              {COMPOSITION.map((c) => (
                <div key={c.label} className="group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-zinc-200 font-medium">{c.label}</span>
                    <c.icon size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-zinc-500">40.5 mm</span>
              <span className="text-xs text-zinc-500">72 h reserve</span>
            </div>
          </div>
        </section>

        {/* ============ CALIBRE / TECHNOLOGY ============ */}
        <section id="tech" className="h-screen w-full flex flex-col items-center justify-center text-center px-6">
          <div className="relative z-20 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 border border-zinc-800 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium tracking-widest text-zinc-400">CALIBRE AG-72</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl md:text-8xl font-medium tracking-tighter text-white">QUIET</h2>
              <h3 className="text-5xl md:text-8xl font-medium tracking-tighter text-zinc-800">OBSESSION.</h3>
            </div>

            <p className="mt-4 text-lg text-zinc-500 max-w-lg mx-auto leading-relaxed tracking-tight">
              The escapement beats in open view — 28,800 vibrations per hour, finished in rhodium and
              adjusted across five positions in Geneva.
            </p>
          </div>
        </section>

        {/* ============ FEATURES & BUY ============ */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-32 px-6 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-32">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-panel p-6 rounded-lg flex flex-col justify-between h-48 hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <f.icon size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">{f.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-8 relative">
            <div className="text-center">
              <h2 className="text-4xl font-medium tracking-tight text-white mb-2">The Collection</h2>
              <p className="text-zinc-500 text-sm">Select your configuration.</p>
            </div>

            <div className="flex gap-4 p-1 bg-white/5 rounded-lg backdrop-blur-sm">
              {FINISHES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFinish(f)}
                  className={`px-6 py-2 rounded text-xs font-medium transition-colors ${
                    finish === f ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="h-px w-24 bg-zinc-800 my-2" />

            <div className="text-center space-y-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg text-zinc-500">CHF</span>
                <span className="text-5xl font-semibold tracking-tighter text-white">{Number(productPrice).toLocaleString('en-US')}</span>
              </div>

              <button
                onClick={handleAdd}
                className="relative overflow-hidden bg-white text-black pl-8 pr-6 py-3 rounded-full text-sm font-medium tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-4 group mx-auto"
              >
                <span>ADD TO CART</span>
                <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={12} />
                </div>
              </button>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Complimentary delivery · 5-year warranty</p>
            </div>
          </div>
        </section>

        {/* ============ COLLECTION ============ */}
        <section id="collection" className="py-32 px-6 md:px-24 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-16">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">The Collection</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">
                  Objects of <span className="text-zinc-700">devotion.</span>
                </h2>
              </div>
              <button onClick={() => navigate('/shop')} className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                EXPLORE ALL <ArrowUpRight size={14} />
              </button>
            </div>

            {collectionWatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collectionWatches.map((w, i) => (
                  <button
                    key={w.id}
                    onClick={() => openProduct(w.slug)}
                    className="glass-panel rounded-xl overflow-hidden text-left group transition-colors hover:bg-white/5"
                  >
                    <div className="aspect-square overflow-hidden bg-black/40 relative">
                      <img
                        src={getImageUrl(w.images[0]?.image)}
                        alt={w.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <span className="absolute top-4 left-4 text-xs text-zinc-500 font-mono">0{i + 1}</span>
                    </div>
                    <div className="p-6">
                      <h4 className="text-sm font-medium text-white mb-1">{w.title}</h4>
                      <p className="text-xs text-zinc-500 mb-4">{w.brand.name} · {w.movement}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{formatPrice(w.price)}</span>
                        <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-10 text-center text-zinc-500 text-sm">
                The collection is being curated. Explore the full catalogue.
              </div>
            )}

            <div className="mt-10 text-center md:hidden">
              <button onClick={() => navigate('/shop')} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2">
                EXPLORE ALL <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ============ CRAFT ============ */}
        <section id="craft" className="min-h-screen grid md:grid-cols-2 border-t border-white/5">
          <div className="relative overflow-hidden bg-black/40">
            <img src={productImage} alt="Calibre craft" className="w-full h-full object-cover opacity-70" />
          </div>
          <div className="flex flex-col justify-center px-6 md:px-24 py-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm mb-8 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">The Art of Calibre</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-medium tracking-tighter leading-[0.95] text-white mb-8">
              Precision<br /><span className="text-zinc-700">without hurry.</span>
            </h2>
            <p className="text-zinc-500 text-base font-light leading-relaxed max-w-md mb-10">
              More than 230 individual components, patiently calibrated into a single, enduring movement.
            </p>
            <button
              onClick={() => scrollTo('making')}
              className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded text-xs font-medium hover:bg-zinc-200 transition-all duration-300 w-fit"
            >
              <span>DISCOVER OUR CRAFT</span>
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>

        {/* ============ MAKING ============ */}
        <section id="making" className="py-32 px-6 md:px-24 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Calibre A-01 · Assembly Path</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">
                The making of <span className="text-zinc-700">a Lustro.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {ATELIERS.map((a) => (
                <article key={a.num} className="glass-panel p-6 rounded-lg">
                  <span className="text-xs text-zinc-500 font-mono">{a.num}</span>
                  <h3 className="text-sm font-medium text-white mt-4 mb-2">{a.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{a.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ VOICES ============ */}
        <section className="py-32 px-6 md:px-24 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Client Stories</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">
                Worn by those who value <span className="text-zinc-700">quiet precision.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VOICES.map((v) => (
                <article key={v.name} className="glass-panel p-8 rounded-xl flex flex-col justify-between">
                  <span className="flex gap-1 text-zinc-300 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                    ))}
                  </span>
                  <blockquote className="text-sm text-zinc-300 leading-relaxed font-light mb-8">{v.quote}</blockquote>
                  <footer>
                    <strong className="block text-sm font-medium text-white mb-1">{v.name}</strong>
                    <small className="text-xs text-zinc-500">{v.role}</small>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CLOSING ============ */}
        <section className="h-screen w-full flex flex-col items-center justify-center text-center px-6 border-t border-white/5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">A private appointment awaits</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-medium tracking-tighter leading-[0.95] text-white mb-8">
            Own the moment<br /><span className="text-zinc-700">before it passes.</span>
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto leading-relaxed tracking-tight mb-12">
            A mechanical watch built for precision, presence, and quiet luxury.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button onClick={handleAdd} className="relative overflow-hidden bg-white text-black pl-8 pr-6 py-3 rounded-full text-sm font-medium tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-4 group">
              <span>ADD TO CART</span>
              <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight size={12} />
              </div>
            </button>
            <button onClick={() => setReserveOpen(true)} className="px-6 py-3 rounded-full text-sm font-medium tracking-wide text-zinc-300 border border-white/15 hover:border-white/40 hover:text-white transition-all">
              RESERVE YOURS
            </button>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="w-full border-t border-white/5 py-12 px-6 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-xs font-medium tracking-wide">
          <button onClick={() => scrollTo('top')} className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-4 h-4 rounded-full border border-zinc-700" />
            <span>LUSTRO GENÈVE SA</span>
          </button>
          <div className="flex gap-8 flex-wrap justify-center">
            <button onClick={() => navigate('/shop')} className="hover:text-white transition-colors">Collection</button>
            <button onClick={() => navigate('/shop')} className="hover:text-white transition-colors">Boutiques</button>
            <button onClick={() => setReserveOpen(true)} className="hover:text-white transition-colors">Reserve</button>
            <button onClick={() => navigate('/chronos')} className="hover:text-white transition-colors">Chronos Concept</button>
          </div>
          <span className="mt-4 md:mt-0 text-zinc-700">© MMXXVI LUSTRO GENÈVE SA</span>
        </footer>
      </main>

      {/* ============ CART DRAWER ============ */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70" onClick={() => setCartOpen(false)} />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-[#0a0a0b] border-l border-white/10 flex flex-col">
            <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <span className="text-xs font-medium tracking-widest text-zinc-400 uppercase">Shopping cart</span>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>
            </header>
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <h2 className="text-lg font-medium text-white">Your cart is empty</h2>
                <p className="text-xs text-zinc-500">Objects of devotion await.</p>
                <button onClick={() => { setCartOpen(false); navigate('/shop'); }} className="mt-4 bg-white text-black px-6 py-2 rounded text-xs font-medium hover:bg-zinc-200 transition-colors">EXPLORE THE COLLECTION</button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  {items.map((i) => (
                    <div className="flex gap-4 py-5 border-b border-white/5" key={i.id}>
                      <img src={getImageUrl(i.image)} alt={i.title} className="w-20 h-20 object-cover rounded-lg bg-black/40" />
                      <div className="flex-1">
                        <h3 className="text-sm text-white mb-1">{i.title}</h3>
                        <p className="text-xs text-zinc-500 mb-3">{i.brandName} · {formatPrice(i.price)}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(i.id, i.quantity - 1)} className="w-6 h-6 rounded border border-white/10 text-zinc-400 hover:text-white transition-colors">−</button>
                          <span className="text-xs text-zinc-300">{i.quantity}</span>
                          <button onClick={() => updateQuantity(i.id, i.quantity + 1)} className="w-6 h-6 rounded border border-white/10 text-zinc-400 hover:text-white transition-colors">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <footer className="px-6 py-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Subtotal</span>
                    <strong className="text-white">{formatPrice(totalPrice().toFixed(2))}</strong>
                  </div>
                  <button onClick={() => navigate('/cart')} className="w-full bg-white text-black py-3 rounded text-xs font-medium hover:bg-zinc-200 transition-colors">PROCEED TO CHECKOUT</button>
                  <button onClick={clearCart} className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Clear cart</button>
                </footer>
              </>
            )}
          </aside>
        </>
      )}

      {/* ============ RESERVE DIALOG ============ */}
      {reserveOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setReserveOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md glass-panel rounded-xl p-8 bg-[#0a0a0b]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Private Appointment</span>
                  </div>
                  <h2 className="text-2xl font-medium tracking-tight text-white">Reserve <span className="text-zinc-600">yours.</span></h2>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-3">Book a private viewing in our Geneva salon — by appointment only. We will confirm within one business day.</p>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => setReserveOpen(false)} aria-label="Close appointment form"><X size={16} /></button>
              </div>
              <form onSubmit={handleReserve} className="space-y-4">
                <label className="block">
                  <span className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">Full name</span>
                  <input
                    required
                    placeholder="Your name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">Email address</span>
                  <input
                    required
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">Preferred date</span>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white [color-scheme:dark] focus:outline-none focus:border-white/30 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">Viewing preference</span>
                  <select
                    value={form.preference}
                    onChange={(e) => setForm({ ...form, preference: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white [color-scheme:dark] focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option className="bg-[#0a0a0b]">Private salon, Geneva</option>
                    <option className="bg-[#0a0a0b]">Virtual appointment</option>
                    <option className="bg-[#0a0a0b]">Phone consultation</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">Message <span className="text-zinc-700">(optional)</span></span>
                  <textarea
                    rows={2}
                    placeholder="Anything we should know?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-black py-3 rounded text-xs font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> SENDING</> : <>REQUEST APPOINTMENT <ArrowUpRight size={14} /></>}
                </button>
              </form>
              <small className="block text-center text-[10px] text-zinc-600 uppercase tracking-widest mt-6">By appointment only · Geneva · Paris · New York</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
