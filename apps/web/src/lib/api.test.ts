import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('api response contracts', () => {
  it('accepts a valid critical response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          categories: ['BACKEND'],
          data: [],
        }),
      ),
    );
    await expect(api('/jobs/bootstrap')).resolves.toMatchObject({ categories: ['BACKEND'] });
  });

  it('rejects a successful HTTP response with an invalid domain shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ categories: 'BACKEND' })));
    await expect(api('/jobs/bootstrap')).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_API_RESPONSE',
    } satisfies Partial<ApiError>);
  });
});
