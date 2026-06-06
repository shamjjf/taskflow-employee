'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Select } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { authService } from '../services/authService';

type LoginRole = 'team_leader' | 'employee';

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<LoginRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [organizations, setOrganizations] = useState<
    { id: number; slug: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    let cancelled = false;
    authService
      .listOrganizations()
      .then((orgs) => {
        if (cancelled) return;
        const list = orgs.length > 0 ? orgs : [{ id: 1, slug: 'jjfindia', name: 'JJF India' }];
        setOrganizations(list);
        setOrgSlug((current) => current || list[0].slug);
      })
      .catch(() => {
        if (cancelled) return;
        setOrganizations([{ id: 1, slug: 'jjfindia', name: 'JJF India' }]);
        setOrgSlug('jjfindia');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        email,
        password,
        orgSlug || undefined
      );

      if (user.role === 'super_admin') {
        setError('Super Admins should use the admin portal instead.');
        setLoading(false);
        return;
      }

      if (user.role !== selectedRole) {
        const expectedLabel = selectedRole === 'team_leader' ? 'Team Leader' : 'Employee';
        setError(`This account is not a ${expectedLabel}. Please select the correct role.`);
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
          <div className="text-lg font-semibold tracking-tight">JJFIndia TaskFlow</div>
        </div>
        <h1 className="text-[22px] font-semibold mb-1.5 tracking-tight">Welcome back</h1>
        <p className="text-[#71717a] mb-5 text-sm">Sign in to your account</p>

        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f4f5] border border-border rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('employee');
              setError('');
            }}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              selectedRole === 'employee'
                ? 'bg-white text-primary shadow-sm border border-border'
                : 'text-[#71717a] hover:text-foreground'
            }`}
          >
            Login as Employee
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('team_leader');
              setError('');
            }}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              selectedRole === 'team_leader'
                ? 'bg-white text-primary shadow-sm border border-border'
                : 'text-[#71717a] hover:text-foreground'
            }`}
          >
            Login as Team Leader
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Organization *"
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            options={organizations.map((o) => ({ value: o.slug, label: o.name }))}
          />
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
