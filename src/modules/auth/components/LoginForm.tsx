'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { authService } from '../services/authService';
import { cn } from '@/lib/utils';

type DemoRole = 'team_leader' | 'employee';

const ROLE_TABS: Record<DemoRole, { label: string; desc: string }> = {
  team_leader: {
    label: 'Team Leader',
    desc: 'Manage your team and approve reports',
  },
  employee: {
    label: 'Employee',
    desc: 'View your own tasks and submit reports',
  },
};

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<DemoRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleRoleChange = (role: DemoRole) => {
    setSelectedRole(role);
  };

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

        <div className="grid grid-cols-2 gap-1 mb-5 p-1 bg-surface-muted rounded-md">
          {(Object.keys(ROLE_TABS) as DemoRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleChange(role)}
              className={cn(
                'py-2 px-3 rounded text-[13px] font-medium transition-all',
                selectedRole === role
                  ? 'bg-white text-[#18181b] shadow-sm'
                  : 'text-[#71717a] hover:text-[#18181b]'
              )}
            >
              {ROLE_TABS[role].label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
        <div className="mt-5 p-3 bg-info-soft rounded-md text-xs text-info leading-relaxed">
          <strong>Demo:</strong> {ROLE_TABS[selectedRole].desc}
        </div>
      </div>
    </div>
  );
}
