import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth';
import { response } from './test/render';

function AuthProbe() {
  const { user } = useAuth();
  return <div>{user?.displayName}</div>;
}

describe('initial workspace bootstrap', () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
    vi.unstubAllGlobals();
  });

  it('hydrates all home query caches from one request', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL) =>
      response({
        user: {
          id: 'member',
          email: 'member@example.test',
          displayName: '부트스트랩 멤버',
          role: 'MEMBER',
          preferredLanguage: 'javascript',
          onboardingCompleted: true,
        },
        unreadCount: 3,
        home: {
          collections: [{ id: 'folder-1', name: '취업 준비', items: [] }],
          dailyChallenges: [{ id: 'challenge-1', levelSlot: 1 }],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('부트스트랩 멤버')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/bootstrap?home=1');
    expect(client.getQueryData(['notification-unread-count'])).toEqual({ count: 3 });
    expect(client.getQueryData(['collections'])).toEqual([
      { id: 'folder-1', name: '취업 준비', items: [] },
    ]);
    expect(client.getQueryData(['daily-challenges'])).toEqual([
      { id: 'challenge-1', levelSlot: 1 },
    ]);
  });

  it('hydrates the first job page and filters from one job bootstrap request', async () => {
    window.history.replaceState({}, '', '/jobs?companySize=STARTUP&q=backend');
    const catalog = [
      {
        id: 'job-1',
        title: 'Backend Engineer',
        company: { name: 'CareerGround' },
      },
    ];
    const fetchMock = vi.fn((_input: RequestInfo | URL) =>
      response({
        user: {
          id: 'member',
          email: 'member@example.test',
          displayName: '채용 멤버',
          role: 'MEMBER',
          preferredLanguage: 'javascript',
          onboardingCompleted: true,
        },
        unreadCount: 2,
        categories: ['백엔드'],
        data: catalog,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('채용 멤버')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/jobs/bootstrap?catalog=true');
    expect(url).not.toContain('companySize=STARTUP');
    expect(url).not.toContain('q=backend');
    expect(client.getQueryData(['jobs', 'categories'])).toEqual(['백엔드']);
    expect(client.getQueryData(['jobs', 'catalog'])).toEqual(catalog);
  });

  it('hydrates the learning library from one learning bootstrap request', async () => {
    window.history.replaceState({}, '', '/learning?unit=unit-one');
    const sources = [
      {
        id: 'source-one',
        title: '학습 자료',
        subject: '데이터',
        category: '기초',
        units: [{ id: 'unit-one', title: '첫 단원' }],
      },
    ];
    const fetchMock = vi.fn((_input: RequestInfo | URL) =>
      response({
        user: {
          id: 'member',
          email: 'member@example.test',
          displayName: '학습 멤버',
          role: 'MEMBER',
          preferredLanguage: 'javascript',
          onboardingCompleted: true,
        },
        unreadCount: 1,
        data: sources,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('학습 멤버')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/learning/bootstrap');
    expect(client.getQueryData(['learning'])).toEqual(sources);
    expect(client.getQueryData(['notification-unread-count'])).toEqual({ count: 1 });
  });
});
