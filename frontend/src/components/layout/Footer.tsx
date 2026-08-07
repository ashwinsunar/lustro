import { Link } from 'react-router-dom';
import { Container } from './Container';

export function Footer() {
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
            <div className="flex gap-4">
              {['Instagram', 'Twitter', 'Facebook', 'YouTube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-white/40 hover:text-gold transition-colors text-sm tracking-widest uppercase font-space"
                >
                  {social.substring(0, 2)}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Collections */}
          <div>
            <h4 className="font-space tracking-widest uppercase text-sm mb-6 text-white">Explore</h4>
            <ul className="space-y-4">
              {[
                { name: 'All Collections', path: '/shop' },
                { name: 'New Arrivals', path: '/shop?new_arrival=true' },
                { name: 'Trending Now', path: '/shop?trending=true' },
                { name: 'Wishlist', path: '/wishlist' },
                { name: 'Compare', path: '/compare' },
              ].map((link) => (
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
              {['Rolex', 'Omega', 'TAG Heuer', 'Patek Philippe', 'IWC', 'Breitling'].map((brand) => (
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
              {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service', 'Shipping Policy', 'Returns'].map((link) => (
                <li key={link}>
                  <Link to="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    {link}
                  </Link>
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
