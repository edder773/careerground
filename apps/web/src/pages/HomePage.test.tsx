import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage, type Collection } from './HomePage';
import { renderPage, response } from '../test/render';

describe('favorites workspace', () => {
  let collections: Collection[];
  const calls: Array<{ url: string; method: string }> = [];

  beforeEach(() => {
    collections = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: '예전 취업 준비 폴더',
        icon: 'folder',
        color: 'cyan',
        position: 0,
        items: [
          {
            id: 'item-learning',
            itemType: 'LEARNING_UNIT',
            targetId: 'unit-prompt',
            label: '프롬프트 설계 핵심',
          },
        ],
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: '예전 학습 폴더',
        icon: 'folder',
        color: 'amber',
        position: 1,
        items: [
          {
            id: 'item-learning-copy',
            itemType: 'LEARNING_UNIT',
            targetId: 'unit-prompt',
            label: '프롬프트 설계 핵심',
          },
        ],
      },
    ];
    calls.length = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        calls.push({ url, method });
        if (url.endsWith('/collections') && method === 'GET') return response(collections);
        if (url.includes('/collections/') && url.includes('/items/') && method === 'DELETE') {
          const itemId = url.split('/').at(-1);
          collections = collections.map((collection) => ({
            ...collection,
            items: collection.items.filter((item) => item.id !== itemId),
          }));
          return response({ count: 1 });
        }
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
    expect(screen.queryByText('예전 취업 준비 폴더')).not.toBeInTheDocument();
  });

  it('removes one favorite from every legacy folder placement', async () => {
    const user = userEvent.setup();
    renderPage(<HomePage viewMode="list" />);

    await user.click(
      await screen.findByRole('button', { name: '프롬프트 설계 핵심 즐겨찾기 해제' }),
    );

    await waitFor(() => expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(2));
    expect(await screen.findByText('아직 저장한 항목이 없습니다')).toBeInTheDocument();
  });
});
