import { create } from 'zustand';
import type { User } from '@/types';
import { authStorage } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, token) => {
    authStorage.setToken(token);
    authStorage.setUser(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    authStorage.clear();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    authStorage.setUser(user);
    set({ user });
  },

  hydrate: () => {
    const user = authStorage.getUser();
    const token = authStorage.getToken();
    set({
      user,
      isAuthenticated: !!(user && token),
      isLoading: false,
    });
  },
}));
