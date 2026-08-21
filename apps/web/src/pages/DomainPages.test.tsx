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
  const jobBootstrap = (data: unknown, categories: string[]) =>
    response({
      user: {
        id: 'member',
        email: 'member@example.test',
        displayName: '멤버',
        role: 'MEMBER',
        preferredLanguage: 'javascript',
        onboardingCompleted: true,
      },
      unreadCount: 0,
      categories,
      data,
    });
  beforeEach(() => {
    calls.length = 0;
  });
  afterEach(cleanup);

  it('builds job categories from the catalog and applies the selected filters', async () => {
    const catalog = [
      {
        id: 'job-1',
        title: 'Fullstack Engineer',
        category: 'BACKEND',
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
      {
        id: 'job-2',
        title: 'Frontend Engineer',
        category: 'FRONTEND',
        region: '판교',
        remote: false,
        techStack: ['TypeScript'],
        rolling: true,
        summary: '웹 서비스 개발',
        sourceUrl: 'https://example.test/jobs/2',
        company: { name: '다른회사', size: 'LARGE' },
        source: { name: '회사 채용 홈페이지' },
        savedBy: [],
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, method: init?.method || 'GET' });
        return jobBootstrap(catalog, ['BACKEND', 'FRONTEND']);
      }),
    );
    const user = userEvent.setup();
    renderPage(<JobsPage />);
    const companySearch = await screen.findByRole('searchbox', { name: '회사명 검색' });
    await user.type(companySearch, 'Hudson');
    expect(await screen.findByText('1개 공고')).toBeInTheDocument();
    await user.clear(companySearch);
    expect(await screen.findByText('2개 공고')).toBeInTheDocument();
    await user.type(await screen.findByRole('searchbox', { name: '공고 검색' }), 'backend');
    await user.click(await screen.findByRole('button', { name: '채용공고 필터' }));
    const filter = screen.getByRole('dialog', { name: '채용공고 전체 필터' });
    const largeCompany = within(filter).getByRole('checkbox', { name: '대기업' });
    await user.click(largeCompany);
    expect(largeCompany.nextElementSibling?.querySelector('svg')).toBeInTheDocument();
    await user.click(within(filter).getByRole('checkbox', { name: '중견기업' }));
    await user.click(within(filter).getByRole('checkbox', { name: '백엔드' }));
    expect(
      calls.some((call) => {
        const params = new URL(call.url, 'https://careerground.example').searchParams;
        return params.has('companySize') || params.has('category');
      }),
    ).toBe(false);
    await user.click(within(filter).getByRole('button', { name: '3개 조건 적용' }));
    expect(await screen.findByText('0개 공고')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /채용공고 필터, 3개 선택/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /채용공고 필터, 3개 선택/ }));
    const reopenedFilter = screen.getByRole('dialog', { name: '채용공고 전체 필터' });
    expect(within(reopenedFilter).getByRole('checkbox', { name: '대기업' })).toBeChecked();
    expect(within(reopenedFilter).getByRole('checkbox', { name: '중견기업' })).toBeChecked();
    expect(within(reopenedFilter).getByRole('checkbox', { name: '백엔드' })).toBeChecked();
    await user.click(within(reopenedFilter).getByRole('button', { name: '필터 닫기' }));
    await user.click(screen.getByRole('button', { name: '마감 임박순' }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.url).toContain('/jobs/bootstrap?catalog=true');
    await user.click(screen.getByRole('button', { name: '크게' }));
    expect(document.querySelector('.jobs-page')).toHaveAttribute('data-font-size', 'large');
  });

  it('shows company deadlines in a monthly calendar with prominent source details', async () => {
    const now = new Date();
    const deadlineAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 15, 6, 0, 0),
    ).toISOString();
    const publishedAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 3, 6, 0, 0),
    ).toISOString();
    const applicationStartAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 5, 6, 0, 0),
    ).toISOString();
    const collectedAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 10, 6, 0, 0),
    ).toISOString();
    const job = {
      id: '11111111-1111-4111-8111-111111111111',
      title: '신입 플랫폼 엔지니어',
      category: '백엔드',
      region: '서울',
      remote: false,
      techStack: ['TypeScript'],
      publishedAt,
      applicationStartAt,
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
        return jobBootstrap([job], ['백엔드']);
      }),
    );
    const user = userEvent.setup();
    renderPage(<JobsPage />);

    expect(await screen.findByText('Example Careers')).toBeInTheDocument();
    expect(screen.getByText('careers.example.com')).toBeInTheDocument();
    expect(screen.getByText(/확인일/)).toBeInTheDocument();
    expect(screen.queryByText(/마지막 확인/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '달력' }));
    const legend = await screen.findByLabelText('일정 색상 안내');
    expect(within(legend).queryByText('등록일')).not.toBeInTheDocument();
    expect(within(legend).getByText('접수 시작일')).toBeInTheDocument();
    expect(screen.queryByText('시작·확인일')).not.toBeInTheDocument();
    expect(within(legend).getByText('마감일')).toBeInTheDocument();
    expect(within(legend).getByText('상시')).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', {
        name: '캘린더테크 신입 플랫폼 엔지니어 접수 시작일 상세 보기',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: '캘린더테크' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('신입 플랫폼 엔지니어');
    expect(calls).toHaveLength(2);
    expect(calls[0]?.url).toContain('/jobs/bootstrap?catalog=true');
    expect(calls.some((call) => call.url.includes('calendar=true'))).toBe(false);
  });

  it('opens rolling jobs and hidden daily events in dedicated dialogs', async () => {
    const now = new Date();
    const deadlineAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 18, 6, 0, 0),
    ).toISOString();
    const collectedAt = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 7, 6, 0, 0),
    ).toISOString();
    const catalog = [
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `calendar-job-${index}`,
        title: `신입 엔지니어 ${index + 1}`,
        category: '백엔드',
        region: '서울',
        remote: false,
        techStack: ['TypeScript'],
        applicationStartAt: collectedAt,
        collectedAt,
        deadlineAt,
        rolling: false,
        summary: '신입 서비스 개발 포지션',
        sourceUrl: `https://careers.example.com/jobs/${index + 1}`,
        company: { name: `일정회사 ${index + 1}`, size: 'MID' },
        source: { name: 'Example Careers', lastSuccessAt: collectedAt },
        savedBy: [],
      })),
      {
        id: 'rolling-job',
        title: '상시 신입 개발자',
        category: '프론트엔드',
        region: '서울',
        remote: true,
        techStack: ['React'],
        collectedAt,
        rolling: true,
        summary: '상시채용 포지션',
        sourceUrl: 'https://careers.example.com/jobs/rolling',
        company: { name: '상시회사', size: 'STARTUP' },
        source: { name: 'Example Careers', lastSuccessAt: collectedAt },
        savedBy: [],
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL) => {
        return jobBootstrap(catalog, ['백엔드', '프론트엔드']);
      }),
    );
    const user = userEvent.setup();
    renderPage(<JobsPage />);

    await user.click(await screen.findByRole('button', { name: '달력' }));
    await user.click(screen.getByRole('button', { name: /상시채용 확인하기/ }));
    const rollingDialog = screen.getByRole('dialog', { name: '상시채용 공고' });
    expect(rollingDialog).toHaveTextContent('상시회사');
    await user.click(within(rollingDialog).getByRole('button', { name: '닫기' }));

    const moreButtons = screen.getAllByRole('button', { name: /추가 공고 2개 보기/ });
    expect(moreButtons).toHaveLength(2);
    const more = moreButtons[1];
    if (!more) throw new Error('두 번째 날짜의 추가 공고 버튼을 찾을 수 없습니다.');
    await user.click(more);
    const dayDialog = screen.getByRole('dialog', { name: /채용 일정/ });
    expect(within(dayDialog).getAllByRole('button', { name: /상세 보기/ })).toHaveLength(6);
    await user.click(
      within(dayDialog).getByRole('button', { name: '일정회사 1 신입 엔지니어 1 상세 보기' }),
    );
    expect(screen.getByRole('dialog', { name: '일정회사 1' })).toHaveTextContent('신입 엔지니어 1');
  });

  it('posts a sanitized comment through the solution flow', async () => {
    const solution = {
      id: '11111111-1111-4111-8111-111111111111',
      problemId: 'problem-1',
      title: '풀이 기록',
      language: 'javascript',
      code: 'const answer = 1;',
      description: '설명',
      descriptionPreview: '설명',
      solved: true,
      currentRev: 1,
      canEdit: true,
      reactionCount: 0,
      reactedByMe: false,
      commentCount: 0,
      author: { displayName: '김그라운드' },
      problem: { displayTitle: '데모 문제', level: 1 },
      reactions: [],
      revisions: [
        { id: 'revision-1', revision: 1, code: 'const answer = 1;', description: '설명' },
      ],
      comments: [],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method: init?.method || 'GET', body });
        if (url.includes('/coding/solutions?')) {
          return response({ items: [solution], nextCursor: null, total: 1 });
        }
        if ((init?.method || 'GET') === 'GET' && url.endsWith(`/coding/solutions/${solution.id}`)) {
          return response(solution);
        }
        return response({ id: 'comment' });
      }),
    );
    const user = userEvent.setup();
    renderPage(<SolutionsPage />);
    await user.click(await screen.findByRole('button', { name: /코드·revision·댓글 보기/ }));
    await user.type(await screen.findByRole('textbox', { name: '댓글' }), '좋은 설명입니다.');
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

  it('opens learning content without an understanding rating prompt', async () => {
    const detail = {
      id: '11111111-1111-4111-8111-111111111111',
      title: '포커스',
      summary: '# 포커스의 핵심\n\n키보드 사용자가 흐름을 놓치지 않게 설계합니다.',
      concepts: ['키보드'],
      visuals: [],
      flashcards: [{ id: 'f', front: '포커스란?', back: '현재 입력 위치입니다.' }],
      questions: [{ id: 'q', prompt: '왜 필요한가요?', attempts: [] }],
      progress: [],
    };
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
            summaryPreview: detail.summary,
            flashcardCount: 1,
            questionCount: 1,
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
        if (url.endsWith(`/learning/units/${detail.id}`)) return response(detail);
        return response({});
      }),
    );
    const user = userEvent.setup();
    renderPage(<LearningPage />);
    expect(screen.queryByRole('button', { name: /학습 시작|이해도 4점/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '포커스 내용 보기' }));
    expect(screen.getByRole('dialog', { name: '포커스' })).toHaveTextContent('포커스의 핵심');
    expect(screen.getByText('포커스란?')).toBeInTheDocument();
    expect(screen.queryByText('이 단원을 얼마나 이해했나요?')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /이해도 기록/ })).not.toBeInTheDocument();
    expect(calls.some((call) => call.url.endsWith('/learning/review'))).toBe(false);
  });

  it('shows dense ranking and its calculation fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        response({
          calculatedAt: '2026-08-12T00:00:00Z',
          currentUserId: 'u',
          selfReported: false,
          periods: {
            timezone: 'Asia/Seoul',
            weeklyStart: '2026-08-10T00:00:00+09:00',
            monthlyStart: '2026-08-01T00:00:00+09:00',
          },
          methodology: '모든 멤버의 SOLVED 풀이를 자동 계산합니다.',
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
