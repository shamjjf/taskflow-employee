'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { authService } from '../services/authService';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      if (user.role === 'super_admin') {
        setError('Super Admins should use the admin portal instead.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', refreshToken);
      }

      login(user, accessToken);
      router.push('/dashboard');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-[#fafafa] to-[#f4f4f5]">
      <div className="w-full max-w-md bg-white border border-border rounded-lg p-10 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <div className="text-lg font-semibold tracking-tight">TaskFlow</div>
        </div>
        <h1 className="text-[22px] font-semibold mb-1.5 tracking-tight">Welcome back</h1>
        <p className="text-[#71717a] mb-5 text-sm">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </Button>
        </form>
      </div>
    </div>
  );
}
