import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, json, type User } from './lib/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  activate: (input: { token: string; displayName: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/auth/me'),
    retry: false,
  });
  const loginMutation = useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<{ user: User }>('/auth/login', { method: 'POST', body: json(input) }),
    onSuccess: (value) => client.setQueryData(['me'], value),
  });
  const activateMutation = useMutation({
    mutationFn: (input: { token: string; displayName: string; password: string }) =>
      api<{ user: User }>('/auth/activate', { method: 'POST', body: json(input) }),
    onSuccess: (value) => client.setQueryData(['me'], value),
  });
  const logoutMutation = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => client.setQueryData(['me'], null),
  });
  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data?.user || null,
      loading: me.isLoading,
      login: async (input) => {
        await loginMutation.mutateAsync(input);
      },
      activate: async (input) => {
        await activateMutation.mutateAsync(input);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [me.data, me.isLoading, loginMutation, activateMutation, logoutMutation],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
