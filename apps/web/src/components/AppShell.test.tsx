import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../auth';
import { AppShell } from './AppShell';
import { response } from '../test/render';

describe('responsive application navigation', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        String(input).endsWith('/auth/me')
          ? response({
              user: { id: 'u', email: 'member@example.com', displayName: '멤버', role: 'MEMBER' },
            })
          : response({}),
      ),
    );
  });
  it('keeps the closed drawer out of the accessibility tree and opens mobile navigation', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithProviders(client);
    expect((await screen.findAllByRole('navigation', { name: '주요 메뉴' })).length).toBe(1);
    expect(screen.getByRole('link', { name: '배움집 자격증 학습 새 창에서 열기' })).toHaveAttribute(
      'href',
      'https://baeumzip.site',
    );
    expect(screen.getByRole('link', { name: '배움집 자격증 학습 새 창에서 열기' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('navigation', { name: '모바일 주요 메뉴' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(screen.getAllByRole('navigation', { name: '주요 메뉴' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toBeInTheDocument();
  });
});

function renderWithProviders(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <AppShell viewMode="grid" onViewMode={() => undefined}>
            <div>content</div>
          </AppShell>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
