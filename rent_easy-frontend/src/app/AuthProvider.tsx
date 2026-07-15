'use client';

import { useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/lib/auth-store';
import { usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setInitialized, isInitialized } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get('/v1/users/me');
        if (response.data && response.data.id) {
          setAuth(response.data);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
      } finally {
        setInitialized();
      }
    };

    initAuth();
  }, [setAuth, clearAuth, setInitialized]);

  // Optionally, you can show a loading spinner while initializing, 
  // but usually we want to render children immediately and let protected routes handle redirecting.
  // Or if we strictly want to block rendering until we know the user:
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
