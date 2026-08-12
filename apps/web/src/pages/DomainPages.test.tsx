import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobsPage } from './JobsPage';
import { SolutionsPage } from './SolutionsPage';
import { LearningPage } from './LearningPage';
import { RankingPage } from './RankingPage';
import { renderPage, response } from '../test/render';

describe('domain pages', () => {
  const calls: Array<{ url: string; method: string; body?: unknown }> = [];
  beforeEach(() => {
    calls.length = 0;
  });

  it('applies company-size and job-category filters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, method: init?.method || 'GET' });
        return response([]);
      }),
    );
    const user = userEvent.setup();
    renderPage(<JobsPage />);
    await user.selectOptions(await screen.findByRole('combobox', { name: '기업 규모' }), 'LARGE');
    await user.selectOptions(screen.getByRole('combobox', { name: '직무' }), '백엔드');
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.url.includes('companySize=LARGE') &&
            call.url.includes(encodeURIComponent('백엔드')),
        ),
      ).toBe(true),
    );
  });

  it('posts a sanitized comment through the solution flow', async () => {
    const solution = {
      id: '11111111-1111-4111-8111-111111111111',
      title: '풀이 기록',
      language: 'javascript',
      code: 'const answer = 1;',
      description: '설명',
      author: { displayName: '김그라운드' },
      problem: { displayTitle: '데모 문제', level: 1 },
      reactions: [],
      comments: [],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method: init?.method || 'GET', body });
        return response(url.endsWith('/coding/solutions') ? [solution] : { id: 'comment' });
      }),
    );
    const user = userEvent.setup();
    renderPage(<SolutionsPage />);
    await user.click(await screen.findByRole('button', { name: '댓글 남기기' }));
    await user.type(screen.getByRole('textbox', { name: '댓글' }), '좋은 설명입니다.');
    await user.click(screen.getByRole('button', { name: '등록' }));
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.url.includes('/comments') &&
            (call.body as { markdown: string }).markdown === '좋은 설명입니다.',
        ),
      ).toBe(true),
    );
  });

  it('records learning progress with a 1–5 rating', async () => {
    const source = [
      {
        id: 's',
        title: '접근성 기초',
        subject: '웹',
        category: '접근성',
        units: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: '포커스',
            summary: '요약',
            concepts: ['키보드'],
            flashcards: [],
            questions: [],
            progress: [],
          },
        ],
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method: init?.method || 'GET', body });
        if (url.endsWith('/learning')) return response(source);
        if (url.endsWith('/learning/due')) return response([]);
        return response({});
      }),
    );
    const user = userEvent.setup();
    renderPage(<LearningPage />);
    await user.click(await screen.findByRole('button', { name: '이해도 4점' }));
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.url.endsWith('/learning/review') && (call.body as { rating: number }).rating === 4,
        ),
      ).toBe(true),
    );
  });

  it('shows dense ranking and its calculation fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        response({
          calculatedAt: '2026-08-12T00:00:00Z',
          selfReported: true,
          rows: [
            {
              userId: 'u',
              displayName: '김그라운드',
              rank: 1,
              score: 3,
              weekly: 2,
              monthly: 3,
              streak: 2,
              challengeCount: 5,
            },
          ],
        }),
      ),
    );
    renderPage(<RankingPage />);
    expect(await screen.findByText('김그라운드')).toBeInTheDocument();
    expect(screen.getByText('멤버가 해결한 문제 수', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('2일')).toBeInTheDocument();
  });
});
