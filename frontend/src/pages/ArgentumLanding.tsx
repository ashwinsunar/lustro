import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function ArgentumLanding() {
  const navigate = useNavigate();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data === 'argentum:scroll-section' && frameRef.current) {
        frameRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <iframe
        ref={frameRef}
        src="/argentum/index.html"
        title="Aurelis Landing"
        className="h-full w-full border-0"
        onLoad={() => setReady(true)}
      />
      <div
        className={`fixed bottom-6 right-6 z-50 transition-opacity duration-700 ${
          ready ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="group flex items-center gap-2 rounded-full border border-gold/40 bg-black/60 px-6 py-3 font-serif text-[11px] uppercase tracking-[0.3em] text-white backdrop-blur-xl transition hover:border-gold hover:bg-gold hover:text-black"
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
          Shop the Collection
        </button>
      </div>
    </div>
  );
}