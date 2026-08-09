import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';

import Navbar from './components/Navbar';
import { Footer, PageTransition } from './components/layout';
import ChatWidget from './components/ChatWidget';

const LuxuryHome = lazy(() => import('./pages/LuxuryHome'));
const ArgentumLanding = lazy(() => import('./pages/ArgentumLanding'));
const ChronosPage = lazy(() => import('./pages/ChronosPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const BrandDetailPage = lazy(() => import('./pages/BrandDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <Router>
          <Shell />
          <Toaster
            theme="dark"
            toastOptions={{
              className: 'bg-zinc-900 border-white/10 text-white font-space tracking-wide',
              descriptionClassName: 'text-white/60',
            }}
          />
        </Router>
      </MotionConfig>
    </QueryClientProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border border-white/15 border-t-white animate-spin" />
    </div>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const isImmersive = pathname === '/' || pathname === '/chronos';
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-gold/30 selection:text-white dark flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-gold focus:text-black focus:px-4 focus:py-2 focus:text-xs font-space tracking-widest uppercase"
      >
        Skip to content
      </a>
      <ScrollToTop />
      {isImmersive ? (
        <Link
          to="/"
          className="fixed top-5 left-6 z-50 transition-opacity hover:opacity-80"
          aria-label="Lustro home"
        >
          <img src="/logo-128.png" alt="Lustro" className="h-10 w-auto" />
        </Link>
      ) : (
        <Navbar />
      )}

      <main id="main-content" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<PageTransition><ArgentumLanding /></PageTransition>} />
            <Route path="/chronos" element={<PageTransition><ChronosPage /></PageTransition>} />
            <Route path="/luxury" element={<PageTransition><LuxuryHome /></PageTransition>} />
            <Route path="/legacy" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/shop" element={<PageTransition><ShopPage /></PageTransition>} />
            <Route path="/watch/:slug" element={<PageTransition><ProductPage /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
            <Route path="/wishlist" element={<PageTransition><WishlistPage /></PageTransition>} />
            <Route path="/compare" element={<PageTransition><ComparePage /></PageTransition>} />
            <Route path="/brands" element={<PageTransition><BrandsPage /></PageTransition>} />
            <Route path="/brands/:slug" element={<PageTransition><BrandDetailPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="/profile/orders" element={<PageTransition><OrdersPage /></PageTransition>} />
            <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
            <Route path="/order/:orderNumber" element={<PageTransition><OrderConfirmationPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
          </Routes>
        </Suspense>
      </main>

      {!isImmersive && <Footer />}
      <ChatWidget />
    </div>
  );
}