import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

describe('responsive application navigation', () => {
  it('exposes only the four retained product destinations', async () => {
    renderWithProviders();

    const primaryNavigation = screen.getByRole('navigation', { name: '주요 메뉴' });
    expect(primaryNavigation).toHaveTextContent('채용공고코딩테스트자격증즐겨찾기');
    expect(within(primaryNavigation).getAllByRole('link')).toHaveLength(4);
    expect(
      within(primaryNavigation).getByRole('link', { name: '자격증 새 창에서 열기' }),
    ).toHaveAttribute('href', 'https://baeumzip.site');
    expect(
      within(primaryNavigation).getByRole('link', { name: '자격증 새 창에서 열기' }),
    ).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('link', { name: '학습' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '검색' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '모바일 주요 메뉴' })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(screen.getAllByRole('navigation', { name: '주요 메뉴' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toBeInTheDocument();
  });
});

function renderWithProviders() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
