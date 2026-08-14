import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotesPage } from './NotesPage';
import { AuthProvider } from '../auth';
import { renderPage, response } from '../test/render';

const note = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'member',
  title: '기존 노트',
  markdown: '정리한 내용',
  currentRev: 1,
  updatedAt: '2026-08-12T00:00:00.000Z',
  revisions: [
    {
      id: 'revision',
      revision: 1,
      markdown: '정리한 내용',
      createdAt: '2026-08-12T00:00:00.000Z',
    },
  ],
};

const member = {
  id: 'member',
  email: 'member@example.test',
  displayName: '멤버',
  role: 'MEMBER',
  preferredLanguage: 'python',
  onboardingCompleted: true,
};

describe('personal note workbench', () => {
  it('creates a private note without exposing a visibility control', async () => {
    const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        const body = init?.body
          ? (JSON.parse(String(init.body)) as Record<string, unknown>)
          : undefined;
        calls.push({ url, method, body });
        if (method === 'GET' && url.endsWith('/auth/me')) return response({ user: member });
        if (method === 'GET' && url.endsWith('/notes/trash')) return response([]);
        if (method === 'GET' && url.endsWith('/notes')) return response([note]);
        return response({ ...note, id: 'new-note', title: body?.title, markdown: body?.markdown });
      }),
    );
    const user = userEvent.setup();
    renderPage(
      <AuthProvider>
        <NotesPage />
      </AuthProvider>,
    );

    await user.click(await screen.findByRole('button', { name: '새 노트' }));
    await user.type(screen.getByRole('textbox', { name: '노트 제목' }), '면접 준비');
    await user.type(screen.getByRole('textbox', { name: '노트 내용' }), '# 질문 목록');
    expect(screen.getByRole('heading', { name: '질문 목록' })).toBeInTheDocument();
    expect(screen.queryByLabelText('공개 범위')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem('cg-note-draft:member:new')).toContain('질문 목록'),
    );
    await user.click(screen.getByRole('button', { name: /^저장$/ }));

    await waitFor(() =>
      expect(calls).toContainEqual({
        url: 'http://localhost:4000/api/v1/notes',
        method: 'POST',
        body: { title: '면접 준비', markdown: '# 질문 목록' },
      }),
    );
    expect(window.localStorage.getItem('cg-note-draft:member:new')).toBeNull();
  });

  it('deletes only through an explicit confirmation', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        calls.push({ url, method });
        if (method === 'GET' && url.endsWith('/auth/me')) return response({ user: member });
        if (method === 'GET' && url.endsWith('/notes/trash')) return response([]);
        if (method === 'GET') return response([note]);
        return response({ deleted: true });
      }),
    );
    const user = userEvent.setup();
    renderPage(
      <AuthProvider>
        <NotesPage />
      </AuthProvider>,
    );

    await screen.findByText('기존 노트');
    await user.click(await screen.findByRole('button', { name: '노트 삭제' }));
    await waitFor(() =>
      expect(calls).toContainEqual({
        url: `http://localhost:4000/api/v1/notes/${note.id}`,
        method: 'DELETE',
      }),
    );
  });

  it('restores a deleted note from the private trash list', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        calls.push({ url, method });
        if (method === 'GET' && url.endsWith('/auth/me')) return response({ user: member });
        if (method === 'GET' && url.endsWith('/notes/trash'))
          return response([
            { id: 'deleted-note', title: '삭제된 면접 노트', deletedAt: '2026-08-14T00:00:00Z' },
          ]);
        if (method === 'GET') return response([note]);
        return response({ restored: true });
      }),
    );
    const user = userEvent.setup();
    renderPage(
      <AuthProvider>
        <NotesPage />
      </AuthProvider>,
    );

    await user.click(await screen.findByText('최근 삭제 1개'));
    await user.click(screen.getByRole('button', { name: '삭제된 면접 노트 복원' }));
    await waitFor(() =>
      expect(calls).toContainEqual({
        url: 'http://localhost:4000/api/v1/notes/deleted-note/restore',
        method: 'POST',
      }),
    );
  });

  it('restores a user-scoped local draft after an interrupted edit', async () => {
    window.localStorage.setItem(
      `cg-note-draft:member:${note.id}`,
      JSON.stringify({
        title: '복구된 제목',
        markdown: '# 브라우저 임시 저장 복구',
        baseRevision: 1,
        savedAt: '2026-08-14T00:00:00.000Z',
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/auth/me')) return response({ user: member });
        if (url.endsWith('/notes/trash')) return response([]);
        return response([note]);
      }),
    );
    renderPage(
      <AuthProvider>
        <NotesPage />
      </AuthProvider>,
    );

    expect(await screen.findByRole('textbox', { name: '노트 제목' })).toHaveValue('복구된 제목');
    expect(screen.getByRole('textbox', { name: '노트 내용' })).toHaveValue(
      '# 브라우저 임시 저장 복구',
    );
  });
});
