'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';
import { authService } from '@/modules/auth/services/authService';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isTeamLeader } = useRole();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Best-effort backend logout so the server-side refresh token is
    // revoked alongside the local clear.
    try {
      await authService.logout();
    } catch {
      // ignored
    }
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 pl-1 pr-2 py-1 rounded-md transition-colors',
          isOpen ? 'bg-surface-muted' : 'hover:bg-surface-muted'
        )}
      >
        <Avatar initials={user.initials || 'U'} color={user.color} src={user.profileImage} size="md" />
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <div className="text-[12.5px] font-medium leading-tight truncate max-w-[120px]">
            {user.name}
          </div>
          <div className="text-[10.5px] text-[#71717a] leading-tight">
            {isTeamLeader ? 'Team Leader' : user.designation || 'Employee'}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-[#71717a] transition-transform',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-60 bg-white border border-border rounded-lg shadow-xl py-1.5 z-50">
          <div className="px-3 py-2.5 border-b border-border">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="text-[11.5px] text-[#71717a] truncate">{user.email}</div>
            {user.departmentName && (
              <div className="text-[11px] text-[#a1a1aa] mt-0.5">
                {user.departmentName} · {isTeamLeader ? 'Team Leader' : 'Employee'}
              </div>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                router.push('/profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#18181b] hover:bg-surface-muted transition-colors text-left"
            >
              <User size={14} className="text-[#71717a]" />
              My Profile
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-danger hover:bg-danger-soft transition-colors text-left"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
