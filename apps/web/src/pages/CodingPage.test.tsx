import { screen, waitFor } from '@testing-library/react';
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
      tags: ['구현'],
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/1',
      progress: [],
      _count: { solutions: 0 },
    };
    const levelTwoProblem = {
      ...problem,
      id: '22222222-2222-4222-8222-222222222222',
      displayTitle: '데모 문제 Lv. 2',
      level: 2,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/2',
    };
    const calls: Array<{ url: string; body?: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        if (url.endsWith('/auth/me'))
          return response({
            user: {
              id: 'member',
              email: 'member@example.test',
              displayName: '멤버',
              role: 'MEMBER',
              preferredLanguage: 'javascript',
              onboardingCompleted: true,
            },
          });
        if (url.endsWith('/coding/problems')) return response([problem, levelTwoProblem]);
        if (url.endsWith('/coding/daily-challenges'))
          return response([
            { id: 'daily-lv1', problemId: problem.id, problem },
            { id: 'daily-lv2', problemId: levelTwoProblem.id, problem: levelTwoProblem },
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
    expect(await screen.findByRole('region', { name: '오늘의 문제 2개' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '데모 문제 원본 열기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '데모 문제 Lv. 2 원본 열기' })).toBeInTheDocument();
    const dailySection = screen.getByRole('region', { name: '오늘의 문제 2개' });
    expect(dailySection.querySelectorAll('a[href^="/solutions?"]')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: '풀이 기록' })[0]!);
    expect(screen.getByRole('dialog', { name: '데모 문제' })).toBeInTheDocument();
    const language = screen.getByRole('combobox', { name: '언어' });
    await waitFor(() => expect(language).toHaveValue('javascript'));
    expect(
      Array.from(language.querySelectorAll('option')).map((option) => option.textContent),
    ).toEqual(['Python', 'Java', 'JavaScript', 'C++']);
    expect(screen.queryByRole('combobox', { name: '공개 범위' })).not.toBeInTheDocument();
    expect(screen.getByText('저장한 풀이는 다른 멤버도 바로 볼 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /해결 기록 저장/ })).toBeDisabled();
    await waitFor(() => expect(calls.some((call) => call.url.includes('/progress'))).toBe(true));
  });
});
