import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type User } from './lib/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User | null }>('/auth/me'),
    retry: (failureCount, error) =>
      failureCount < 2 && error instanceof ApiError && (error.status === 0 || error.status >= 500),
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 2_000),
  });
  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data?.user || null,
      loading: me.isLoading,
      error: me.error instanceof ApiError && me.error.status !== 401 ? me.error : null,
      retry: () => void me.refetch(),
      logout: async () => {
        await api('/auth/logout', { method: 'POST' });
        client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' });
        client.setQueryData(['me'], { user: null });
      },
    }),
    [client, me.data, me.error, me.isLoading, me.refetch],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
