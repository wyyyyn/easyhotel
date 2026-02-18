import { create } from 'zustand';
import type { User, AuthResponse } from '@easyhotel/shared';
import { authApi } from '@easyhotel/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: (authResponse: AuthResponse) => {
    localStorage.setItem('token', authResponse.access_token);
    set({ token: authResponse.access_token, user: authResponse.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  fetchProfile: async () => {
    try {
      const user = await authApi.getProfile();
      set({ user });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null });
    }
  },
}));
