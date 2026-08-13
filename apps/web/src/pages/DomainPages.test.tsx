import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(cleanup);

  it('builds job categories from the catalog and applies the selected filters', async () => {
    const catalog = [
      {
        id: 'job-1',
        title: 'Fullstack Engineer',
        category: 'AI 풀스택 개발',
        region: '서울',
        remote: false,
        techStack: ['Python'],
        rolling: true,
        summary: 'AI 서비스 개발',
        sourceUrl: 'https://example.test/jobs/1',
        company: { name: 'Hudson AI', size: 'STARTUP' },
        source: { name: '로켓펀치' },
        savedBy: [],
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, method: init?.method || 'GET' });
        return response(url.endsWith('/jobs/categories') ? ['AI 풀스택 개발'] : catalog);
      }),
    );
    const user = userEvent.setup();
    renderPage(<JobsPage />);
    await user.selectOptions(await screen.findByRole('combobox', { name: '기업 규모' }), 'LARGE');
    await user.selectOptions(
      await screen.findByRole('combobox', { name: '직무' }),
      'AI 풀스택 개발',
    );
    await waitFor(() =>
      expect(
        calls.some((call) => {
          const params = new URL(call.url, 'https://careerground.example').searchParams;
          return (
            params.get('companySize') === 'LARGE' && params.get('category') === 'AI 풀스택 개발'
          );
        }),
      ).toBe(true),
    );
  });

  it('shows company deadlines in a monthly calendar with prominent source details', async () => {
    const now = new Date();
    const deadlineAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 15, 6, 0, 0),
    ).toISOString();
    const collectedAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 5, 6, 0, 0),
    ).toISOString();
    const job = {
      id: '11111111-1111-4111-8111-111111111111',
      title: '신입 플랫폼 엔지니어',
      category: '백엔드',
      region: '서울',
      remote: false,
      techStack: ['TypeScript'],
      collectedAt,
      deadlineAt,
      rolling: false,
      summary: '신입 서비스 개발 포지션',
      sourceUrl: 'https://careers.example.com/jobs/1',
      company: { name: '캘린더테크', size: 'MID' },
      source: { name: 'Example Careers', lastSuccessAt: '2026-08-12T00:00:00.000Z' },
      savedBy: [],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, method: init?.method || 'GET' });
        return response(url.endsWith('/jobs/categories') ? ['백엔드'] : [job]);
      }),
    );
    const user = userEvent.setup();
    renderPage(<JobsPage />);

    expect(await screen.findByText('Example Careers')).toBeInTheDocument();
    expect(screen.getByText('careers.example.com')).toBeInTheDocument();
    expect(screen.getByText(/최신일/)).toBeInTheDocument();
    expect(screen.queryByText(/마지막 확인/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '달력' }));
    const legend = await screen.findByLabelText('일정 색상 안내');
    expect(within(legend).getByText('시작일')).toBeInTheDocument();
    expect(within(legend).getByText('마감일')).toBeInTheDocument();
    expect(within(legend).getByText('상시')).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', {
        name: '캘린더테크 신입 플랫폼 엔지니어 마감일 상세 보기',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: '캘린더테크' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('신입 플랫폼 엔지니어');
    expect(
      calls.some(
        (call) =>
          call.url.includes('calendar=true') &&
          call.url.includes('deadlineFrom=') &&
          call.url.includes('deadlineTo='),
      ),
    ).toBe(true);
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
            summary: '# 포커스의 핵심\n\n키보드 사용자가 흐름을 놓치지 않게 설계합니다.',
            concepts: ['키보드'],
            flashcards: [{ id: 'f', front: '포커스란?', back: '현재 입력 위치입니다.' }],
            questions: [
              { id: 'q', prompt: '왜 필요한가요?', answer: '현재 위치를 알기 위해서입니다.' },
            ],
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
    await user.click(await screen.findByRole('button', { name: /학습 시작/ }));
    expect(screen.getByRole('dialog', { name: '포커스' })).toHaveTextContent('포커스의 핵심');
    expect(screen.getByText('포커스란?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '닫기' }));
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
