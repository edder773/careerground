import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage, type Collection } from './HomePage';
import { renderPage, response } from '../test/render';

describe('folder workspace', () => {
  let folders: Collection[];
  let deletedFolders: Collection[];
  const calls: Array<{ url: string; method: string; body?: unknown }> = [];

  beforeEach(() => {
    folders = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: '취업 준비',
        icon: 'folder',
        color: 'cyan',
        position: 0,
        items: [],
      },
    ];
    deletedFolders = [];
    calls.length = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method, body });
        if (url.endsWith('/collections/trash') && method === 'GET') return response(deletedFolders);
        if (url.endsWith('/collections') && method === 'GET') return response(folders);
        if (url.endsWith('/collections') && method === 'POST') {
          const folder = {
            id: '22222222-2222-4222-8222-222222222222',
            ...body,
            position: 1,
            items: [],
          } as Collection;
          folders = [...folders, folder];
          return response(folder);
        }
        if (url.includes('/collections/2222') && method === 'PATCH') {
          folders[1] = { ...folders[1]!, name: body.name };
          return response(folders[1]);
        }
        if (url.includes('/items') && method === 'POST') {
          folders[1]!.items.push({ id: 'item-1', ...body });
          return response(folders[1]!.items[0]);
        }
        if (url.endsWith('/dashboard')) return response({ recentJobs: 4, expiringJobs: 1 });
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

  it('creates, renames, and adds an external item to a folder', async () => {
    const user = userEvent.setup();
    renderPage(<HomePage viewMode="grid" />);
    expect(await screen.findByText('취업 준비')).toBeInTheDocument();
    expect(await screen.findByText('오늘의 Lv. 1')).toBeInTheDocument();
    expect(screen.getByText('오늘의 Lv. 2')).toBeInTheDocument();
    expect(screen.getByText('오늘의 SQL')).toBeInTheDocument();
    expect(screen.getByText('SQL · Lv. 3')).toBeInTheDocument();
    expect(screen.queryByText('오늘 복습')).not.toBeInTheDocument();
    expect(screen.queryByText('복습 예정')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /관심 공고.*지원 후보 모음/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /새 폴더/ }));
    await user.type(screen.getByRole('textbox', { name: '폴더 이름' }), '코테 모음');
    await user.click(screen.getByRole('button', { name: '만들기' }));
    expect((await screen.findAllByText('코테 모음')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /이름 변경/ }));
    const rename = screen.getByRole('textbox', { name: '새 폴더 이름' });
    fireEvent.change(rename, { target: { value: '알고리즘' } });
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect((await screen.findAllByText('알고리즘')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /링크 추가/ }));
    await user.type(screen.getByRole('textbox', { name: '외부 링크' }), 'https://example.com/note');
    await user.type(screen.getByRole('textbox', { name: '표시 이름' }), '참고 링크');
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByText('참고 링크')).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.some((call) => call.method === 'POST' && call.url.includes('/items'))).toBe(
        true,
      ),
    );
  });

  it('restores a recently deleted folder from the workspace', async () => {
    deletedFolders = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: '삭제된 지원 자료',
        icon: 'folder',
        color: 'violet',
        position: 0,
        items: [],
      },
    ];
    const user = userEvent.setup();
    renderPage(<HomePage viewMode="grid" />);

    await user.click(await screen.findByText('최근 삭제한 폴더 1개'));
    expect(screen.getByText('삭제된 지원 자료')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '복원' }));

    await waitFor(() =>
      expect(calls).toContainEqual({
        url: 'http://localhost:4000/api/v1/collections/33333333-3333-4333-8333-333333333333/restore',
        method: 'POST',
        body: undefined,
      }),
    );
  });
});
