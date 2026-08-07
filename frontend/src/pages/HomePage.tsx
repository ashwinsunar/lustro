import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { WatchGrid, WatchCard, WatchCardSkeleton } from '../components/watch';
import { Section, Container } from '../components/layout';
import { fetchFeaturedWatches, fetchNewArrivals, fetchTrending, fetchBestSellers } from '../services/watches';
import { fetchBrands } from '../services/brands';
import { Button } from '../components/ui';
import { cn } from '../lib/utils';

export default function HomePage() {
  
  const { data: featured = [], isLoading: loadingFeatured } = useQuery({ queryKey: ['watches', 'featured'], queryFn: fetchFeaturedWatches });
  const { data: newArrivals = [], isLoading: loadingNew } = useQuery({ queryKey: ['watches', 'new'], queryFn: fetchNewArrivals });
  const { data: trending = [], isLoading: loadingTrending } = useQuery({ queryKey: ['watches', 'trending'], queryFn: fetchTrending });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });

  // Hero animation setup — use named easing strings to satisfy Framer Motion Variants types
  const heroItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* 1. Cinematic Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
        {/* Background Image with Parallax/Zoom effect via CSS */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity scale-105 animate-[float_20s_ease-in-out_infinite]"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=2070&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/80 z-0" />
        <div className="grain absolute inset-0 z-0" />
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20 flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}>
            <p className="text-gold font-space tracking-[0.4em] text-xs md:text-sm mb-8 uppercase font-medium">
              The Art of Time
            </p>
          </motion.div>
          
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}>
            <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-light tracking-tight mb-8 leading-[1.1] text-balance">
              Elegance in <br className="hidden md:block" /> Every Second
            </h1>
          </motion.div>
          
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}>
            <p className="text-base md:text-lg text-white/60 mb-12 font-light max-w-2xl mx-auto text-balance">
              Discover our curated collection of premium luxury timepieces. 
              Crafted for those who appreciate the extraordinary.
            </p>
          </motion.div>
          
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to="/shop" className={cn('inline-flex items-center justify-center h-14 px-12 bg-gold text-black font-space font-semibold tracking-widest uppercase text-sm transition-all duration-300 hover:brightness-110 hover:scale-[1.02] w-full sm:w-auto')}>
              Explore Collection
            </Link>
            <Link to="/brands" className={cn('inline-flex items-center justify-center h-14 px-12 border border-white/20 text-white font-space font-semibold tracking-widest uppercase text-sm transition-all duration-300 hover:bg-white/5 hover:border-white/40 w-full sm:w-auto')}>
              View Brands
            </Link>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div 
          initial="hidden" animate="visible" variants={heroItemVariants} transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
          className="absolute bottom-24 w-full px-6 z-10 hidden md:block"
        >
          <Container className="flex justify-between items-center border-t luxury-border pt-6 text-white/40 text-xs font-space tracking-widest uppercase">
            <span>500+ Timepieces</span>
            <span>50+ Luxury Brands</span>
            <span>Est. 2024</span>
          </Container>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1.2, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/40 font-space">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </section>

      {/* 2. Marquee Brand Strip */}
      <div className="w-full overflow-hidden bg-zinc-950 border-y border-white/5 py-4 relative z-20">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2].map((group) => (
            <div key={group} className="flex items-center gap-12 px-6">
              {['ROLEX', 'OMEGA', 'TAG HEUER', 'PATEK PHILIPPE', 'IWC', 'BREITLING', 'CARTIER', 'AUDEMARS PIGUET'].map((brand, idx) => (
                <div key={idx} className="flex items-center gap-12 text-white/60 font-space tracking-widest text-sm uppercase">
                  <span>{brand}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Featured Collections */}
      <Section className="bg-zinc-950">
        <Container>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6">
            <div>
              <p className="text-gold tracking-[0.2em] text-xs font-space uppercase mb-4">Curated Selections</p>
              <h2 className="text-4xl md:text-5xl font-light">Featured Timepieces</h2>
            </div>
            <Link to="/shop?featured=true" className="group flex items-center gap-2 text-xs font-space tracking-widest uppercase text-white/60 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <WatchGrid watches={featured} isLoading={loadingFeatured} columns={3} skeletonCount={3} />
        </Container>
      </Section>

      {/* 4. AI Watch Finder CTA */}
      <Section className="py-0 relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="relative bg-zinc-900 border border-white/5 rounded-xl overflow-hidden py-24 px-6 text-center">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08)_0%,transparent_70%)] pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative z-10 flex flex-col items-center max-w-2xl mx-auto"
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-gold">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-gold tracking-[0.2em] text-xs font-space uppercase mb-4 font-semibold">Powered by AI</p>
              <h2 className="text-4xl md:text-5xl font-light mb-6">Find Your Perfect Timepiece</h2>
              <p className="text-white/60 mb-10 text-balance leading-relaxed">
                Not sure what you're looking for? Chat with our AI watch expert to get personalized recommendations based on your style, lifestyle, and budget.
              </p>
              <Button size="lg" className="px-10">
                Chat With AI Assistant
              </Button>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* 5. Trending Now */}
      <Section className="bg-zinc-950">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-4">Trending Now</h2>
            <p className="text-white/50 font-space tracking-widest text-xs uppercase">Most desired pieces this week</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Large Featured Card (Left) */}
            <div className="lg:col-span-7">
              {loadingTrending ? (
                <WatchCardSkeleton className="h-[600px] aspect-auto" />
              ) : trending[0] ? (
                <div className="h-full">
                  <WatchCard watch={trending[0]} className="h-full [&>div:first-child]:h-[500px]" />
                </div>
              ) : null}
            </div>
            
            {/* Two Stacked Cards (Right) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              {loadingTrending ? (
                <>
                  <WatchCardSkeleton className="h-[280px] aspect-auto" />
                  <WatchCardSkeleton className="h-[280px] aspect-auto" />
                </>
              ) : (
                <>
                  {trending[1] && <WatchCard watch={trending[1]} className="flex-1 [&>div:first-child]:h-[300px] lg:[&>div:first-child]:h-[220px]" />}
                  {trending[2] && <WatchCard watch={trending[2]} className="flex-1 [&>div:first-child]:h-[300px] lg:[&>div:first-child]:h-[220px]" />}
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* 6. Newsletter */}
      <Section className="border-t border-white/5 bg-[#0c0c0e]">
        <Container className="max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-4">Join the Collection</h2>
          <p className="text-white/50 mb-10 text-sm">Be the first to know about new arrivals, exclusive offers, and watchmaking editorials.</p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-transparent border-b border-white/20 px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors font-space"
              required
            />
            <Button type="submit" className="sm:w-auto mt-4 sm:mt-0">
              Subscribe
            </Button>
          </form>
        </Container>
      </Section>
    </>
  );
}
