import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, clearToken, getToken, setToken } from '@/lib/admin-api';

type AdminUser = { id: number; name: string; email: string };

type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi
      .get('/admin/auth/me')
      .then((res) => setUser(res.data.user ?? res.data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminApi.post('/admin/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
