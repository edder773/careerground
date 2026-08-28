import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';
import { renderPage, response } from '../test/render';

describe('favorites workspace', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'careerground.favorites.v1',
      JSON.stringify([
        {
          itemType: 'LEARNING_UNIT',
          targetId: 'unit-prompt',
          label: '프롬프트 설계 핵심',
          href: '/learning?unit=unit-prompt',
        },
      ]),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/coding/daily-challenges'))
          return response([
            {
              id: 'challenge-lv1',
              problemId: 'problem-lv1',
              problem: {
                id: 'problem-lv1',
                displayTitle: '오늘의 Lv. 1',
                level: 1,
                track: 'ALGORITHM',
                sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/1',
              },
            },
            {
              id: 'challenge-lv2',
              problemId: 'problem-lv2',
              problem: {
                id: 'problem-lv2',
                displayTitle: '오늘의 Lv. 2',
                level: 2,
                track: 'ALGORITHM',
                sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/2',
              },
            },
            {
              id: 'challenge-sql',
              problemId: 'problem-sql',
              problem: {
                id: 'problem-sql',
                displayTitle: '오늘의 SQL',
                level: 3,
                track: 'SQL',
                sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/3',
              },
            },
          ]);
        return response({});
      }),
    );
  });

  it('shows one favorites surface without job counters or folder controls', async () => {
    renderPage(<HomePage viewMode="grid" />);

    expect(await screen.findByRole('heading', { name: '즐겨찾기', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('오늘의 Lv. 1')).toBeInTheDocument();
    expect(screen.getByText('오늘의 Lv. 2')).toBeInTheDocument();
    expect(screen.getByText('오늘의 SQL')).toBeInTheDocument();
    expect(screen.getByText('프롬프트 설계 핵심')).toBeInTheDocument();
    expect(screen.getByText('저장한 항목').parentElement).toHaveTextContent('1개');
    expect(screen.getByRole('link', { name: /즐겨찾기 문제/ })).toHaveAttribute(
      'href',
      '/coding?favorites=1&view=all',
    );
    expect(screen.getByRole('link', { name: /관심 공고/ })).toHaveAttribute(
      'href',
      '/jobs?saved=1',
    );
    expect(screen.queryByText('신규 공고')).not.toBeInTheDocument();
    expect(screen.queryByText('마감 임박')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /새 폴더|폴더 만들기/ })).not.toBeInTheDocument();
    expect(screen.getByText('이 브라우저에서 별표한 항목을 한곳에 모았습니다.')).toBeVisible();
  });

  it('removes a device-local favorite without an API request', async () => {
    const user = userEvent.setup();
    renderPage(<HomePage viewMode="list" />);

    await user.click(
      await screen.findByRole('button', { name: '프롬프트 설계 핵심 즐겨찾기 해제' }),
    );

    expect(await screen.findByText('아직 저장한 항목이 없습니다')).toBeInTheDocument();
    expect(window.localStorage.getItem('careerground.favorites.v1')).toBe('[]');
  });
});
