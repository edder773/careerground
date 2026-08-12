import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type User } from './lib/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/auth/me'),
    retry: false,
  });
  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data?.user || null,
      loading: me.isLoading,
      logout: async () => {
        window.location.assign('/signout-with-chatgpt?return_to=%2F');
      },
    }),
    [me.data, me.isLoading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
