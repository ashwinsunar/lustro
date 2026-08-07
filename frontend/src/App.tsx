import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Navbar from './components/Navbar';
import { Footer, PageTransition } from './components/layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';

// Placeholder components for routing
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-gold/30 selection:text-white dark flex flex-col">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
              <Route path="/shop" element={<PageTransition><ShopPage /></PageTransition>} />
              <Route path="/watch/:slug" element={<PageTransition><ProductPage /></PageTransition>} />
              <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
              <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
              <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
              {/* Other routes will be built later */}
            </Routes>
          </main>

          <Footer />
          <ChatWidget />
          
          <Toaster 
            theme="dark"
            toastOptions={{
              className: 'bg-zinc-900 border-white/10 text-white font-space tracking-wide',
              descriptionClassName: 'text-white/60',
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
