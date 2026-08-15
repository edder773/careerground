import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type User } from './lib/api';

type BootstrapPayload = {
  user: User;
  unreadCount: number;
  home: null | {
    collections: unknown[];
    dashboard: {
      recentJobs: number;
      expiringJobs: number;
      dueReviews: number;
      recentActivity: unknown[];
    };
    dailyChallenges: unknown[];
  };
};

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
    queryFn: async () => {
      const includeHome = window.location.pathname === '/';
      const payload = await api<BootstrapPayload>(`/bootstrap${includeHome ? '?home=1' : ''}`);
      client.setQueryData(['notification-unread-count'], { count: payload.unreadCount });
      if (payload.home) {
        client.setQueryData(['collections'], payload.home.collections);
        client.setQueryData(['dashboard'], payload.home.dashboard);
        client.setQueryData(['daily-challenges'], payload.home.dailyChallenges);
      }
      return { user: payload.user };
    },
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
        window.location.assign('/signout-with-chatgpt?return_to=%2F');
      },
    }),
    [me.data, me.error, me.isLoading, me.refetch],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
