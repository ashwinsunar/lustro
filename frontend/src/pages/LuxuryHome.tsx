import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, ShoppingBag, ArrowDown, ArrowUpRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCartStore } from '../store/cartStore';
import { fetchFeaturedWatches } from '../services/watches';
import { getImageUrl } from '../lib/utils';
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

const COLLECTION_WATCHES = [
  { num: '01', name: 'Lustro Moonphase Silver', desc: 'Moonphase · open heart · brushed 904L' },
  { num: '02', name: 'Asteria Classic', desc: '38 mm · White gold' },
  { num: '03', name: 'Lustro Open-Heart Steel', desc: 'Skeletonised balance · steel bracelet' },
];

const FINISHES = ['Black Leather', 'Silver Case', 'Moonphase Dial'];

const CALIBRE_NOTES = [
  { num: '01 — Complication', title: 'Moonphase Display', body: 'A 122-year accurate lunar disc, hand-finished in rhodium.' },
  { num: '02 — Movement', title: 'Open-Heart Movement', body: 'The escapement beats in open view — 28,800 vibrations per hour.' },
  { num: '03 — Autonomy', title: '72h Power Reserve', body: 'A full weekend off the wrist, indicated at nine o’clock.' },
  { num: '04 — Calibre', title: 'Swiss Automatic Calibre', body: 'In-house Calibre AG-72, assembled and adjusted in Geneva.' },
];

const SPEC_TILES = [
  { label: 'COMPLICATION', title: 'Moonphase complication', body: 'The lunar disc deviates by a single day every 122 years.' },
  { label: 'MOVEMENT', title: 'Open-heart automatic', body: '28,800 VPH · 4 HZ · 31 JEWELS' },
  { label: 'CASE', title: 'Brushed silver case', body: '904L STEEL · Ø 40.5 MM · H 11.2 MM' },
  { label: 'STRAP', title: 'Black crocodile leather', body: 'HAND-STITCHED · 142 PASSES' },
  { label: 'RESERVE', title: '72 hours', body: 'A full weekend off the wrist.' },
  { label: 'GLASS', title: 'Sapphire crystal', body: 'DOUBLE-DOMED · AR COATING ×2' },
];

const SPECS = [
  { dt: 'Case', dd: '40.5 mm · brushed 904L' },
  { dt: 'Movement', dd: 'Calibre AG-72 · automatic' },
  { dt: 'Strap', dd: 'Black crocodile leather' },
  { dt: 'Power reserve', dd: '72 hours' },
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
  const { items, addItem, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [finish, setFinish] = useState('Black Leather');

  const { data: featured = [] } = useQuery({ queryKey: ['watches', 'featured'], queryFn: fetchFeaturedWatches });
  const product = featured[0];
  const productPrice = product ? product.price : STATIC_PRODUCT.price;

  const buildCartItem = (): CartItem =>
    product
      ? {
          id: product.id,
          title: product.title,
          price: product.price,
          discount_price: product.discount_price,
          brandName: product.brand.name,
          image: getImageUrl(product.images[0]?.image) ?? WATCH_IMG,
          quantity: 1,
          slug: product.slug,
        }
      : STATIC_PRODUCT;

  const handleAdd = () => addItem(buildCartItem());

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatPrice = (v: string) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n.toLocaleString('en-US') : v;
  };

  return (
    <div className="luxury-body">
      <main className="luxury-page">
        {/* ============ HERO ============ */}
        <section className="hero" id="top">
          <div className="star-field" />
          <header className="nav">
            <button className="brand" onClick={() => scrollTo('top')}>LUSTRO</button>
            <nav className="nav-links">
              <button onClick={() => scrollTo('collection')}>Collection</button>
              <button onClick={() => scrollTo('craft')}>Craftsmanship</button>
              <button onClick={() => scrollTo('calibre')}>The Watch</button>
            </nav>
            <div className="nav-end">
              <button className="cart" onClick={() => setCartOpen(true)}>Cart <b>{totalItems()}</b></button>
              <button className="inquire" onClick={() => setReserveOpen(true)}>Reserve</button>
              <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                {menuOpen ? <X size={18} color="#f0f0eb" /> : <Menu size={18} color="#f0f0eb" />}
              </button>
            </div>
          </header>

          {menuOpen && (
            <div className="mobile-menu">
              <button onClick={() => scrollTo('collection')}>Collection</button>
              <button onClick={() => scrollTo('craft')}>Craftsmanship</button>
              <button onClick={() => scrollTo('calibre')}>The Watch</button>
              <button onClick={() => setReserveOpen(true)}>Reserve</button>
            </div>
          )}

          <div className="hero-content">
            <p className="eyebrow">Manufacture · Since 1948</p>
            <h1>LUSTRO <i>Genève</i></h1>
            <p className="hero-description">Precision shaped by time</p>
            <div className="hero-actions">
              <button className="pill-button" onClick={() => scrollTo('collection')}>
                Explore collection <ArrowDown size={14} />
              </button>
              <button className="reserve-button" onClick={() => setReserveOpen(true)}>Reserve now</button>
            </div>
          </div>

          <div className="hero-footer">
            <span>Scroll</span>
          </div>
        </section>

        {/* ============ CALIBRE ============ */}
        <section className="calibre-section" id="calibre">
          <div className="calibre-title">
            <p className="eyebrow">Calibre AG-72</p>
            <h2>The mechanics of<br /><i>quiet obsession.</i></h2>
          </div>
          <div className="calibre-orbit">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="balance-wheel" />
            <b>AG<br />72</b>
          </div>
          <div className="calibre-notes">
            {CALIBRE_NOTES.map((n) => (
              <article className="calibre-note" key={n.num}>
                <span>{n.num}</span>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ PHILOSOPHY ============ */}
        <section className="philosophy-section">
          <p className="eyebrow dark">Design philosophy</p>
          <h2>Crafted for those who measure life in <i>moments, not minutes.</i></h2>
          <p>Every Lustro case begins as a single billet of 904L steel, brushed by hand until the grain runs unbroken from lug to lug. Nothing is decorated. Everything is finished.</p>
          <span>Case detail · 904L</span>
        </section>

        {/* ============ SPECIFICATION ============ */}
        <section className="spec-section">
          <div className="spec-heading">
            <h2>Eight decisions,<br /><i>no compromises.</i></h2>
            <span>Specification</span>
          </div>
          <div className="spec-grid">
            {SPEC_TILES.map((s) => (
              <article className="spec-tile" key={s.label}>
                <span>{s.label}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <i />
              </article>
            ))}
          </div>
        </section>

        {/* ============ SHOWCASE ============ */}
        <section className="showcase">
          <div className="showcase-visual">
            <p>Moon<br />phase</p>
            <img
              className={`finish-${finish.toLowerCase().replace(' ', '-')}`}
              src={WATCH_IMG}
              alt="Watch detail"
            />
            <span>360° · Scroll to rotate</span>
          </div>
          <div className="showcase-detail">
            <p className="eyebrow">Ref. AG-1948-MS</p>
            <h2>Lustro Moonphase <i>Silver</i></h2>
            <p className="product-copy">A brushed silver case around a black textured dial, carrying a moonphase, a date subdial and an open heart — driven by our in-house automatic calibre.</p>
            <div className="finish-picker">
              {FINISHES.map((f) => (
                <button key={f} className={finish === f ? 'active' : ''} onClick={() => setFinish(f)}>{f}</button>
              ))}
            </div>
            <dl>
              {SPECS.map((s) => (
                <div key={s.dt}>
                  <dt>{s.dt}</dt>
                  <dd>{s.dd}</dd>
                </div>
              ))}
            </dl>
            <div className="product-purchase">
              <strong>CHF {formatPrice(productPrice)}</strong>
              <button onClick={handleAdd} aria-label="Add to cart">
                <ShoppingBag size={17} />
              </button>
            </div>
            <small>Complimentary delivery · 5-year international warranty</small>
          </div>
        </section>

        {/* ============ COLLECTION ============ */}
        <section className="collection" id="collection">
          <div className="collection-head">
            <div>
              <p className="eyebrow">The collection</p>
              <h2>Objects of <i>devotion.</i></h2>
            </div>
            <button className="text-button" onClick={() => navigate('/shop')}>
              Explore all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="watch-gallery">
            {COLLECTION_WATCHES.map((w, i) => (
              <button
                key={w.num}
                className={`watch-card${activeCard === i ? ' selected' : ''}`}
                onClick={() => setActiveCard(i)}
              >
                <img src={WATCH_IMG} alt={w.name} />
                <span className="card-shade" />
                <div className="watch-info">
                  <span>{w.num}</span>
                  <div>
                    <strong>{w.name}</strong>
                    <small>{w.desc}</small>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="collection-bottom">
            <span>Selected:</span>
            <div className="progress"><i style={{ width: `${((activeCard + 1) / 3) * 100}%` }} /></div>
            <span>0{activeCard + 1} / 03</span>
          </div>
        </section>

        {/* ============ CRAFT ============ */}
        <section className="craft-section" id="craft">
          <img src={WATCH_IMG} alt="Calibre craft" />
          <div>
            <p className="eyebrow dark">The art of calibre</p>
            <h2>Precision<br /><i>without hurry.</i></h2>
            <p>More than 230 individual components, patiently calibrated into a single, enduring movement.</p>
            <button className="line-button">Discover our craft <ArrowUpRight size={14} /></button>
          </div>
        </section>

        {/* ============ MAKING ============ */}
        <section className="making-section">
          <div className="making-head">
            <p className="eyebrow">Calibre A-01 · Assembly path</p>
            <h2>The making of <i>an Lustro.</i></h2>
          </div>
          <div className="assembly-path">
            {ATELIERS.map((a) => (
              <article key={a.num}>
                <span>{a.num}</span>
                <div>
                  <small>Atelier</small>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ============ VOICES ============ */}
        <section className="voices-section">
          <div>
            <p className="eyebrow">Client stories</p>
            <h2>Worn by those who value <i>quiet precision.</i></h2>
          </div>
          <div className="voices-grid">
            {VOICES.map((v) => (
              <article key={v.name}>
                <span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                <blockquote>{v.quote}</blockquote>
                <footer>
                  <strong>{v.name}</strong>
                  <small>{v.role}</small>
                </footer>
              </article>
            ))}
          </div>
        </section>

        {/* ============ CLOSING ============ */}
        <section className="closing-section">
          <p className="eyebrow">A private appointment awaits</p>
          <h2>Own the moment <i>before it passes.</i></h2>
          <p>A mechanical moonphase watch built for precision, presence, and quiet luxury.</p>
          <div>
            <button onClick={handleAdd}>Add to cart</button>
            <button onClick={() => setReserveOpen(true)}>Reserve yours</button>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="site-footer">
          <div>
            <strong>LUSTRO GENÈVE</strong>
            <p>Manufacture d'horlogerie. Mechanical watches assembled, finished and adjusted in Geneva since 1948.</p>
          </div>
          <div>
            <span>Collection</span>
            <a href="#collection" onClick={(e) => { e.preventDefault(); scrollTo('collection'); }}>Moonphase Silver</a>
            <a href="#collection" onClick={(e) => { e.preventDefault(); scrollTo('collection'); }}>Black Ceramic</a>
            <a href="#collection" onClick={(e) => { e.preventDefault(); scrollTo('collection'); }}>Open-Heart Steel</a>
          </div>
          <div>
            <span>Client services</span>
            <button onClick={() => setReserveOpen(true)}>Book a private viewing</button>
            <button onClick={() => navigate('/shop')}>Servicing & repairs</button>
            <button onClick={() => navigate('/shop')}>Warranty registration</button>
          </div>
          <div>
            <span>Boutiques</span>
            <p>Geneva — Rue du Rhône 17<br />Paris — Place Vendôme 8<br />New York — Madison Avenue 59</p>
          </div>
          <small>© MMXXVI LUSTRO GENÈVE SA · Terms · Privacy · Cookies</small>
        </footer>
      </main>

      {/* ============ MOBILE MENU HANDLER (backdrop) ============ */}
      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}

      {/* ============ CART DRAWER ============ */}
      {cartOpen && (
        <>
          <div className="cart-layer" onClick={() => setCartOpen(false)} />
          <aside className="cart-drawer">
            <header>
              <span>Shopping cart</span>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={16} /></button>
            </header>
            {items.length === 0 ? (
              <div className="cart-empty">
                <h2>Your cart is empty</h2>
                <p>Objects of devotion await.</p>
              </div>
            ) : (
              <>
                <div>
                  {items.map((i) => (
                    <div className="cart-line" key={i.id}>
                      <img src={getImageUrl(i.image)} alt={i.title} />
                      <div>
                        <h3>{i.title}</h3>
                        <p>{i.brandName} · CHF {formatPrice(i.price)}</p>
                        <div className="quantity">
                          <button onClick={() => updateQuantity(i.id, i.quantity - 1)}>−</button>
                          <span>{i.quantity}</span>
                          <button onClick={() => updateQuantity(i.id, i.quantity + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <footer>
                  <div>
                    <span>Subtotal</span>
                    <strong>CHF {formatPrice(totalPrice().toFixed(2))}</strong>
                  </div>
                  <button onClick={() => navigate('/cart')}>Proceed to checkout</button>
                  <button onClick={clearCart} style={{ background: 'transparent', color: '#686a67' }}>Clear cart</button>
                  <small>Complimentary delivery · 5-year international warranty</small>
                </footer>
              </>
            )}
          </aside>
        </>
      )}

      {/* ============ RESERVE DIALOG ============ */}
      {reserveOpen && (
        <>
          <div className="reserve-layer" onClick={() => setReserveOpen(false)} />
          <div className="reserve-dialog">
            <button className="dialog-close" onClick={() => setReserveOpen(false)} aria-label="Close appointment form">
              <X size={17} />
            </button>
            <p className="eyebrow">A private appointment awaits</p>
            <h2>Reserve<br /><i>yours.</i></h2>
            <p>Book a private viewing of the Lustro Moonphase Silver in our Geneva salon — by appointment only. We will confirm within one business day.</p>
            <form onSubmit={(e) => { e.preventDefault(); setReserveOpen(false); toast.success('Appointment request received — our boutique will confirm shortly.'); }}>
              <label>Full name<input required placeholder="Your name" /></label>
              <label>Email address<input required type="email" placeholder="you@example.com" /></label>
              <label>Preferred date<input type="date" required /></label>
              <label>
                Viewing preference
                <select defaultValue="Private salon, Geneva">
                  <option>Private salon, Geneva</option>
                  <option>Virtual appointment</option>
                  <option>Phone consultation</option>
                </select>
              </label>
              <button type="submit">Request appointment <ArrowUpRight size={14} /></button>
            </form>
            <small>By appointment only · Geneva · Paris · New York</small>
          </div>
        </>
      )}
    </div>
  );
}
