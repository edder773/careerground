import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth';
import { renderPage, response } from '../test/render';
import { SettingsPage } from './SettingsPage';

describe('settings page', () => {
  it('starts read-only, exposes an explicit change action, and omits ranking and privacy requests', async () => {
    const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({
          url,
          method: init?.method || 'GET',
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
        });
        if (url.includes('/bootstrap')) {
          return response({
            user: {
              id: 'member',
              email: 'member@example.test',
              displayName: '기존 이름',
              role: 'MEMBER',
              preferredLanguage: 'python',
              onboardingCompleted: true,
            },
            unreadCount: 0,
            home: null,
          });
        }
        return response({
          id: 'member',
          email: 'member@example.test',
          displayName: '기존 이름',
          preferredLanguage: 'python',
          preference: {
            commentNotifications: true,
            deadlineNotifications: true,
            reviewNotifications: true,
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderPage(
      <AuthProvider>
        <SettingsPage />
      </AuthProvider>,
    );

    const displayName = await screen.findByRole('textbox', { name: '표시 이름' });
    expect(displayName).toBeDisabled();
    expect(screen.getByRole('button', { name: '변경' })).toBeInTheDocument();
    expect(screen.queryByText(/랭킹에 참여/)).not.toBeInTheDocument();
    expect(screen.queryByText(/데이터 JSON 내보내기|데이터 삭제 요청/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '변경' }));
    expect(displayName).toBeEnabled();
    await user.clear(displayName);
    await user.type(displayName, '변경 이름');
    await user.click(screen.getByRole('button', { name: '변경 저장' }));

    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.method === 'PATCH' &&
            call.body?.displayName === '변경 이름' &&
            !Object.hasOwn(call.body, 'rankingOptIn'),
        ),
      ).toBe(true),
    );
  });
});
