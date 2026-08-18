import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';
import { renderPage, response } from '../test/render';

describe('first member setup', () => {
  it('prefills the verified Google display name for confirmation', () => {
    renderPage(<OnboardingPage initialDisplayName="Google Member" />);
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('Google Member');
  });

  it('requires a name and sends one of the four supported languages', async () => {
    const calls: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.body) calls.push(JSON.parse(String(init.body)));
        return response({ id: 'member' });
      }),
    );
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);

    expect(screen.getByRole('button', { name: /내 작업대 시작하기/ })).toBeDisabled();
    expect(screen.getAllByRole('radio').map((input) => input.getAttribute('value'))).toEqual([
      'python',
      'java',
      'javascript',
      'cpp',
    ]);
    await user.type(screen.getByRole('textbox', { name: '이름' }), '김그라운드');
    await user.click(screen.getByRole('radio', { name: 'Java' }));
    await user.click(screen.getByRole('button', { name: /내 작업대 시작하기/ }));

    await waitFor(() =>
      expect(calls).toContainEqual({ displayName: '김그라운드', preferredLanguage: 'java' }),
    );
  });
});
