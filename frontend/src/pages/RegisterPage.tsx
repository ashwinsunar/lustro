import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Container } from '../components/layout';
import { Button, Input } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';
import type { User, AuthTokens } from '../types';

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export default function RegisterPage() {
  usePageMeta({
    title: 'Create Account',
    description: 'Create a Lustro account for private access to the collection, wishlists and order tracking.',
    path: '/register',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<RegisterResponse>('/api/v1/auth/register/', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
      navigate(from || '/');
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { email?: string[]; password?: string[] } } }).response?.data;
      const detail =
        errorData?.email?.[0] || errorData?.password?.[0] || 'Unable to create your account. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 min-h-screen flex items-center justify-center bg-zinc-950">
      <Container className="max-w-md w-full">
        <h1 className="font-display text-4xl font-medium mb-2 text-center">Create Account</h1>
        <p className="text-white/50 text-sm text-center mb-10">Join Lustro for exclusive access.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              required
              autoComplete="given-name"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
              autoComplete="family-name"
            />
          </div>
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
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" isLoading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-white/50 mt-8">
          Already have an account?{' '}
          <Link to="/login" state={from ? { from } : undefined} className="text-gold hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </Container>
    </div>
  );
}