import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Navbar from './components/Navbar';
import { Footer, PageTransition } from './components/layout';
import HomePage from './pages/HomePage';
import LuxuryHome from './pages/LuxuryHome';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrandsPage from './pages/BrandsPage';
import BrandDetailPage from './pages/BrandDetailPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';
import ChatWidget from './components/ChatWidget';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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

function Shell() {
  const { pathname } = useLocation();
  const isLuxuryHome = pathname === '/';
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-gold/30 selection:text-white dark flex flex-col">
      <ScrollToTop />
      {!isLuxuryHome && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PageTransition><LuxuryHome /></PageTransition>} />
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
      </main>

      {!isLuxuryHome && <Footer />}
      <ChatWidget />
    </div>
  );
}