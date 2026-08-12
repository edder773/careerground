import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodingPage } from './CodingPage';
import { renderPage, response } from '../test/render';

describe('solution editor', () => {
  it('lets a member choose PRIVATE visibility before saving', async () => {
    const problem = {
      id: '11111111-1111-4111-8111-111111111111',
      displayTitle: '데모 문제',
      level: 1,
      tags: ['구현'],
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/1',
      progress: [],
      _count: { solutions: 0 },
    };
    const calls: Array<{ url: string; body?: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        if (url.endsWith('/coding/problems')) return response([problem]);
        if (url.endsWith('/coding/daily-challenge')) return response({ id: 'daily', problem });
        return response({});
      }),
    );
    const user = userEvent.setup();
    renderPage(<CodingPage />);
    await user.click(await screen.findByRole('button', { name: '풀이 기록' }));
    await user.selectOptions(screen.getByRole('combobox', { name: '공개 범위' }), 'PRIVATE');
    expect(screen.getByRole('combobox', { name: '공개 범위' })).toHaveValue('PRIVATE');
    expect(screen.getByRole('button', { name: /해결 기록 저장/ })).toBeDisabled();
    await waitFor(() => expect(calls.some((call) => call.url.includes('/progress'))).toBe(true));
  });
});
