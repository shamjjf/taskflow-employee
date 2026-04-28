'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { authService } from '../services/authService';
import { cn } from '@/lib/utils';

type DemoRole = 'team_leader' | 'employee';

const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string; label: string; desc: string }> = {
  team_leader: {
    email: 'arjun@acme.com',
    password: 'password',
    label: 'Team Leader',
    desc: 'Development dept — manage team, approve reports',
  },
  employee: {
    email: 'ananya@acme.com',
    password: 'password',
    label: 'Employee',
    desc: 'Development dept — own tasks and reports',
  },
};

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<DemoRole>('employee');
  const [email, setEmail] = useState(DEMO_ACCOUNTS.employee.email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS.employee.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleRoleChange = (role: DemoRole) => {
    setSelectedRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].password);
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
          {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((role) => (
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
              {DEMO_ACCOUNTS[role].label}
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
          <strong>Demo:</strong> {DEMO_ACCOUNTS[selectedRole].desc}
        </div>
      </div>
    </div>
  );
}
