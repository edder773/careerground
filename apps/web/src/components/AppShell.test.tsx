import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AppShell } from './AppShell';
import { response } from '../test/render';

describe('responsive application navigation', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        String(input).endsWith('/learning') ? response([]) : response({}),
      ),
    );
  });
  it('keeps the closed drawer out of the accessibility tree and opens mobile navigation', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithProviders(client);
    expect((await screen.findAllByRole('navigation', { name: '주요 메뉴' })).length).toBe(1);
    expect(screen.getByRole('link', { name: '자격증 새 창에서 열기' })).toHaveAttribute(
      'href',
      'https://baeumzip.site',
    );
    expect(screen.getByRole('link', { name: '자격증 새 창에서 열기' })).toHaveAttribute(
      'target',
      '_blank',
    );
    const primaryNavigation = screen.getByRole('navigation', { name: '주요 메뉴' });
    expect(primaryNavigation).toHaveTextContent('둘러보기홈채용공고');
    expect(primaryNavigation).toHaveTextContent('학습 도구학습코딩테스트자격증');
    expect(primaryNavigation).not.toHaveTextContent('함께 성장');
    expect(screen.getByRole('navigation', { name: '모바일 주요 메뉴' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '풀이 기록' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '랭킹' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '알림' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '설정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(screen.getAllByRole('navigation', { name: '주요 메뉴' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toBeInTheDocument();
  });

  it('prefetches learning data when navigation intent is shown', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithProviders(client);

    await userEvent.setup().hover(screen.getAllByRole('link', { name: '학습' })[0]!);

    const fetchMock = vi.mocked(fetch);
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/learning'))).toBe(
        true,
      ),
    );
  });
});

function renderWithProviders(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AppShell viewMode="grid" onViewMode={() => undefined}>
          <div>content</div>
        </AppShell>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
