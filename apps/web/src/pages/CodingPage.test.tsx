import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodingPage } from './CodingPage';
import { renderPage, response } from '../test/render';

describe('CodingPage', () => {
  it('offers only recommendations, the full catalog, and durable favorites', async () => {
    const algorithm = {
      id: '11111111-1111-4111-8111-111111111111',
      displayTitle: '데모 문제',
      level: 1,
      track: 'ALGORITHM' as const,
      tags: ['구현'],
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/1',
    };
    const levelTwo = {
      ...algorithm,
      id: '22222222-2222-4222-8222-222222222222',
      displayTitle: '데모 문제 Lv. 2',
      level: 2,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/2',
    };
    const sql = {
      ...algorithm,
      id: '33333333-3333-4333-8333-333333333333',
      displayTitle: '조건에 맞는 사용자 찾기',
      level: 3,
      track: 'SQL' as const,
      tags: ['SELECT'],
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/3',
    };
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method, body });
        if (url.includes('/coding/problems?')) {
          const base = url.includes('track=SQL') ? [sql] : [algorithm, levelTwo];
          return response(base);
        }
        if (url.endsWith('/coding/daily-challenges')) {
          return response([
            { id: 'daily-lv1', problemId: algorithm.id, problem: algorithm },
            { id: 'daily-lv2', problemId: levelTwo.id, problem: levelTwo },
            { id: 'daily-sql', problemId: sql.id, problem: sql },
          ]);
        }
        return response({});
      }),
    );

    const user = userEvent.setup();
    renderPage(<CodingPage />);

    const daily = await screen.findByRole('region', { name: '오늘의 추천 문제' });
    expect(within(daily).getAllByRole('link', { name: /문제 열기/ })).toHaveLength(3);
    expect(within(daily).getAllByRole('button', { name: /즐겨찾기/ })).toHaveLength(3);
    expect(screen.getByRole('button', { name: '전체 문제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByText(/풀이 기록|다른 풀이|랭킹/)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /코드|댓글|풀이 설명/ })).not.toBeInTheDocument();

    const problemGrid = document.querySelector<HTMLElement>('.problem-grid');
    if (!problemGrid) throw new Error('문제 목록을 찾을 수 없습니다.');
    const catalogFavorite = within(problemGrid).getByRole('button', {
      name: '데모 문제 즐겨찾기',
    });
    await user.click(catalogFavorite);
    expect(JSON.parse(window.localStorage.getItem('careerground.favorites.v1') || '[]')).toEqual([
      expect.objectContaining({ itemType: 'CODING_PROBLEM', targetId: algorithm.id }),
    ]);
    await user.click(screen.getByRole('button', { name: /^즐겨찾기$/ }));
    expect(await screen.findByRole('heading', { name: '데모 문제' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '데모 문제 Lv. 2' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전체 문제' }));
    await user.click(screen.getByRole('button', { name: 'SQL' }));
    expect(await screen.findByRole('heading', { name: '조건에 맞는 사용자 찾기' })).toBeVisible();
    expect(calls.some((call) => call.url.includes('/coding/solutions'))).toBe(false);
    expect(calls.some((call) => call.url.includes('/coding/rankings'))).toBe(false);
    expect(calls.some((call) => call.url.includes('/notifications'))).toBe(false);
  });
});
