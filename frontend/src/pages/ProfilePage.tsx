import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '../components/layout';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { usePageMeta } from '../hooks/usePageMeta';
import api from '../services/api';
import type { User } from '../types';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  usePageMeta({
    title: 'My Account',
    description: 'Manage your personal details and review your acquisitions at Lustro.',
    path: '/profile',
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await api.patch<User>('/api/v1/auth/profile/', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      setUser(data);
      toast.success('Profile updated.');
    } catch {
      toast.error('Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="pt-32 pb-32 bg-zinc-950 min-h-screen flex flex-col items-center justify-center text-center">
        <UserIcon className="w-12 h-12 text-white/20 mb-6" strokeWidth={1} />
        <p className="text-white/60 mb-8">Please sign in to view your account.</p>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/login')}>Sign In</Button>
          <Link to="/register">
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen">
      <Container className="max-w-3xl">
        <div className="mb-12">
          <div className="text-white/40 text-xs font-space tracking-widest uppercase mb-4">
            Home / Account
          </div>
          <h1 className="font-display text-4xl font-medium">My Account</h1>
        </div>

        <div className="border border-white/10 bg-zinc-900/40 p-8 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-light">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-white/50 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+41 79 123 45 67"
              autoComplete="tel"
            />
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm mb-8">
            <div className="flex justify-between border-b border-white/5 py-3">
              <span className="text-white/40">Role</span>
              <span className="capitalize text-white/80">{user?.role}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-3">
              <span className="text-white/40">Email</span>
              <span className="text-white/80">{user?.email}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={saveProfile} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
            <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="border border-white/10 bg-zinc-900/40 p-8">
          <h3 className="text-xl font-light mb-6 flex items-center gap-3">
            <Package className="w-5 h-5 text-gold" strokeWidth={1.5} /> Orders
          </h3>
          <p className="text-white/50 text-sm mb-6">
            Track your acquisitions, review your timepieces, and manage deliveries.
          </p>
          <Link to="/profile/orders">
            <Button variant="outline">View my orders</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}