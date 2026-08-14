import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('api response contracts', () => {
  it('accepts a valid critical response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          user: {
            id: 'user-1',
            email: 'member@example.test',
            displayName: '멤버',
            role: 'MEMBER',
            preferredLanguage: 'python',
            onboardingCompleted: true,
          },
        }),
      ),
    );
    await expect(api('/auth/me')).resolves.toMatchObject({ user: { id: 'user-1' } });
  });

  it('rejects a successful HTTP response with an invalid domain shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ user: { role: 'ROOT' } })));
    await expect(api('/auth/me')).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_API_RESPONSE',
    } satisfies Partial<ApiError>);
  });
});
