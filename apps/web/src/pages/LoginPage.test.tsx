import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

describe('Google login page', () => {
  afterEach(() => {
    delete window.google;
    vi.restoreAllMocks();
  });

  it('uses the official Google button callback and stores the authenticated user', async () => {
    let callback: ((response: GoogleCredentialResponse) => void) | undefined;
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn((options) => {
            callback = options.callback;
          }),
          renderButton: vi.fn((parent) => {
            const button = document.createElement('button');
            button.textContent = 'Google 계정으로 계속';
            button.addEventListener('click', () =>
              callback?.({ credential: 'signed.jwt.value', select_by: 'btn' }),
            );
            parent.append(button);
          }),
        },
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 'google-user-1',
            email: 'member@example.test',
            displayName: 'Google Member',
            role: 'MEMBER',
            preferredLanguage: 'javascript',
            onboardingCompleted: false,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Google 계정으로 계속' }));
    await expect
      .poll(() => client.getQueryData(['me']))
      .toMatchObject({
        user: { id: 'google-user-1', displayName: 'Google Member' },
      });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/google'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});
