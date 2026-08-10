import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Container } from '../components/layout';
import { Button, Input } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';
import type { User, AuthTokens } from '../types';

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export default function LoginPage() {
  usePageMeta({
    title: 'Sign In',
    description: 'Sign in to your Lustro account to track orders, save timepieces and check out faster.',
    path: '/login',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>('/api/v1/auth/login/', {
        email: 'demo@lustro.com',
        password: 'Demo1234!',
      });
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
      navigate(from || '/');
    } catch {
      setError('Demo account unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>('/api/v1/auth/login/', { email, password });
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
      navigate(from || '/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 401
          ? 'Invalid email or password.'
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 min-h-screen flex items-center justify-center bg-zinc-950">
      <Container className="max-w-sm w-full">
        <h1 className="font-display text-3xl font-medium mb-2 text-center">Welcome back</h1>
        <p className="text-white/50 text-sm text-center mb-8">Sign in to your Lustro account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-10" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-3 text-white/40">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-10"
          onClick={handleDemoLogin}
          isLoading={loading}
        >
          Try Demo Account
        </Button>

        <p className="text-center text-sm text-white/50 mt-6">
          New to Lustro?{' '}
          <Link
            to="/register"
            state={from ? { from } : undefined}
            className="text-gold hover:text-white transition-colors"
          >
            Create an account
          </Link>
        </p>
      </Container>
    </div>
  );
}