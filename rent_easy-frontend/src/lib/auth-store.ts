import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: UserProfile) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user) => set({ user, isAuthenticated: true, isInitialized: true }),
  clearAuth: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
  setInitialized: () => set({ isInitialized: true }),
}));
