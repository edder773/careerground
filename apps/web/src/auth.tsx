import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type User } from './lib/api';

type BootstrapPayload = {
  user: User;
  unreadCount: number;
  home?: null | {
    collections: unknown[];
    dashboard: {
      recentJobs: number;
      expiringJobs: number;
      dueReviews: number;
      recentActivity: unknown[];
    };
    dailyChallenges: unknown[];
  };
  categories?: string[];
  data?: unknown[] | { items: unknown[]; nextCursor: string | null; total: number };
};

const initialJobsBootstrap = () => {
  const current = new URLSearchParams(window.location.search);
  const companySizes = current.getAll('companySize');
  const categories = current.getAll('category');
  const requestedSort = current.get('sort');
  const sort = requestedSort === 'deadline' || requestedSort === 'company' ? requestedSort : 'new';
  const search = current.get('q') || '';
  const savedOnly = current.get('saved') === '1';
  const request = new URLSearchParams({ sort, page: 'cursor', limit: '40' });
  companySizes.forEach((value) => request.append('companySize', value));
  categories.forEach((value) => request.append('category', value));
  if (search) request.set('q', search);
  if (savedOnly) request.set('saved', '1');
  return {
    path: `/jobs/bootstrap?${request.toString()}`,
    queryKey: [
      'jobs',
      'list',
      companySizes.join('|'),
      categories.join('|'),
      search,
      savedOnly,
      sort,
    ],
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
      const includeJobs = window.location.pathname === '/jobs';
      const jobsBootstrap = includeJobs ? initialJobsBootstrap() : undefined;
      const payload = await api<BootstrapPayload>(
        jobsBootstrap?.path || `/bootstrap${includeHome ? '?home=1' : ''}`,
      );
      client.setQueryData(['notification-unread-count'], { count: payload.unreadCount });
      if (payload.home) {
        client.setQueryData(['collections'], payload.home.collections);
        client.setQueryData(['dashboard'], payload.home.dashboard);
        client.setQueryData(['daily-challenges'], payload.home.dailyChallenges);
      }
      if (jobsBootstrap && payload.categories && payload.data && !Array.isArray(payload.data)) {
        client.setQueryData(['jobs', 'categories'], payload.categories);
        client.setQueryData(jobsBootstrap.queryKey, {
          pages: [payload.data],
          pageParams: [null],
        });
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
