import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Container } from '../components/layout';
import { Button, Input } from '../components/ui';
import type { User, AuthTokens } from '../types';

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>('/api/v1/auth/login/', { email, password });
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
      navigate('/');
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
      <Container className="max-w-md w-full">
        <h1 className="text-4xl font-light mb-2 text-center">Welcome Back</h1>
        <p className="text-white/50 text-sm text-center mb-10">Sign in to your Lustro account.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button type="submit" className="w-full" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-white/50 mt-8">
          New to Lustro?{' '}
          <Link to="/register" className="text-gold hover:text-white transition-colors">
            Create an account
          </Link>
        </p>
      </Container>
    </div>
  );
}