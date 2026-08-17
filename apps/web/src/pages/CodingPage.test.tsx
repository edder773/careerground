import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodingPage } from './CodingPage';
import { AuthProvider } from '../auth';
import { renderPage, response } from '../test/render';

describe('solution editor', () => {
  it('uses one of the four supported languages and does not offer private solutions', async () => {
    const problem = {
      id: '11111111-1111-4111-8111-111111111111',
      displayTitle: '데모 문제',
      level: 1,
      track: 'ALGORITHM' as const,
      tags: ['구현'],
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/1',
      progress: [{ status: 'SOLVED', favorite: false }],
      _count: { solutions: 0 },
    };
    const levelTwoProblem = {
      ...problem,
      id: '22222222-2222-4222-8222-222222222222',
      displayTitle: '데모 문제 Lv. 2',
      level: 2,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/2',
      progress: [],
    };
    const sqlProblem = {
      ...problem,
      id: '33333333-3333-4333-8333-333333333333',
      displayTitle: '조건에 맞는 사용자 찾기',
      level: 3,
      track: 'SQL' as const,
      tags: ['SELECT'],
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/3',
    };
    const calls: Array<{ url: string; body?: unknown }> = [];
    localStorage.setItem(
      `cg-solution-draft:v2:other-member:${problem.id}`,
      JSON.stringify({
        code: 'const leaked = true;',
        description: '다른 계정 초안',
        language: 'javascript',
        savedAt: new Date().toISOString(),
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        if (url.includes('/bootstrap'))
          return response({
            user: {
              id: 'member',
              email: 'member@example.test',
              displayName: '멤버',
              role: 'MEMBER',
              preferredLanguage: 'javascript',
              onboardingCompleted: true,
            },
            unreadCount: 0,
            home: null,
          });
        if (url.includes('/coding/problems?')) {
          const catalog = url.includes('track=SQL') ? [sqlProblem] : [problem, levelTwoProblem];
          const items = url.includes('scope=solved')
            ? catalog.filter((item) => item.progress[0]?.status === 'SOLVED')
            : catalog;
          return response({ items, nextCursor: null, total: items.length });
        }
        if (url.endsWith('/coding/daily-challenges'))
          return response([
            { id: 'daily-lv1', problemId: problem.id, problem },
            { id: 'daily-lv2', problemId: levelTwoProblem.id, problem: levelTwoProblem },
            { id: 'daily-sql', problemId: sqlProblem.id, problem: sqlProblem },
          ]);
        return response({});
      }),
    );
    const user = userEvent.setup();
    renderPage(
      <AuthProvider>
        <CodingPage />
      </AuthProvider>,
    );
    expect(await screen.findByRole('region', { name: '오늘의 문제' })).toBeInTheDocument();
    expect(screen.queryByText(/오늘 두 문제|오늘의 두 문제/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '데모 문제 원본 열기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '데모 문제 Lv. 2 원본 열기' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '조건에 맞는 사용자 찾기 원본 열기' }),
    ).toBeInTheDocument();
    const dailySection = screen.getByRole('region', { name: '오늘의 문제' });
    expect(dailySection.querySelectorAll('article')).toHaveLength(3);
    expect(dailySection.querySelectorAll('a[href^="/solutions?"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '내가 푼 문제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('.problem-grid h2')).map(
          (heading) => heading.textContent,
        ),
      ).toEqual(['데모 문제']),
    );
    expect(calls.some((call) => call.url.includes('scope=solved'))).toBe(true);
    await user.click(screen.getByRole('button', { name: '전체 문제' }));
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('.problem-grid h2')).map(
          (heading) => heading.textContent,
        ),
      ).toEqual(['데모 문제', '데모 문제 Lv. 2']),
    );
    expect(screen.getByRole('button', { name: '전체 문제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(dailySection).getAllByRole('button', { name: '풀이 기록' })[0]!);
    expect(screen.getByRole('dialog', { name: '데모 문제' })).toBeInTheDocument();
    expect(screen.queryByText(/자동 저장 초안을 복원/)).not.toBeInTheDocument();
    const language = screen.getByRole('combobox', { name: '언어' });
    await waitFor(() => expect(language).toHaveValue('javascript'));
    expect(
      Array.from(language.querySelectorAll('option')).map((option) => option.textContent),
    ).toEqual(['Python', 'Java', 'JavaScript', 'C++']);
    expect(screen.queryByRole('combobox', { name: '공개 범위' })).not.toBeInTheDocument();
    expect(screen.getByText('저장한 풀이는 다른 멤버도 바로 볼 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /해결 기록 저장/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(within(dailySection).getAllByRole('button', { name: '풀이 기록' })[2]!);
    const sqlLanguage = screen.getByRole('combobox', { name: '언어' });
    expect(sqlLanguage).toHaveValue('sql');
    expect(
      Array.from(sqlLanguage.querySelectorAll('option')).map((option) => option.textContent),
    ).toEqual(['SQL']);

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: 'SQL' }));
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('.problem-grid h2')).map(
          (heading) => heading.textContent,
        ),
      ).toEqual(['조건에 맞는 사용자 찾기']),
    );
    expect(calls.some((call) => call.url.includes('/progress'))).toBe(false);
  });
});
