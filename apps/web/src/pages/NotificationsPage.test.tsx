import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsPage } from './NotificationsPage';
import { renderPage, response } from '../test/render';

describe('NotificationsPage', () => {
  it('keeps the notification card static and exposes explicit read and navigation actions', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        calls.push({ url, method });
        if (method === 'GET')
          return response({
            items: [
              {
                id: 'notice-1',
                type: 'COMMENT',
                title: '내 풀이에 댓글이 달렸습니다',
                message: '관련 풀이에서 댓글을 확인할 수 있습니다.',
                href: '/solutions?solution=solution-1',
                createdAt: '2026-08-20T00:00:00.000Z',
              },
            ],
            nextCursor: null,
          });
        return response({ count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage(<NotificationsPage />);

    const title = await screen.findByText('내 풀이에 댓글이 달렸습니다');
    fireEvent.click(title);
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '읽음 처리' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '관련 내용 보기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '읽음 처리' }));
    await waitFor(() => expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(1));
  });
});
