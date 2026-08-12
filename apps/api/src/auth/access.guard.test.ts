import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccessGuard } from './access.guard.js';

function contextWith(headers: Record<string, string> = {}) {
  const request = { headers } as Record<string, unknown>;
  const context = {
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AccessGuard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rejects spoofable OpenAI headers outside a trusted proxy boundary', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValueOnce(false) };
    const guard = new AccessGuard(reflector as never, {} as never);
    await expect(
      guard.canActivate(
        contextWith({
          'oai-authenticated-user-id': 'site-user',
          'oai-authenticated-user-email': 'member@example.com',
        }).context,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blocks MEMBER from ADMIN routes after resolving a trusted OpenAI identity', async () => {
    vi.stubEnv('OPENAI_AUTH_MOCK', 'true');
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(['ADMIN']),
    };
    const auth = {
      resolveOpenAiUser: vi.fn(async () => ({
        id: 'member-id',
        email: 'member@example.com',
        displayName: '멤버',
        role: 'MEMBER',
      })),
    };
    const request = contextWith({
      'oai-authenticated-user-id': 'site-user',
      'oai-authenticated-user-email': 'member@example.com',
    });
    const guard = new AccessGuard(reflector as never, auth as never);
    await expect(guard.canActivate(request.context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(request.request.user).toMatchObject({ id: 'member-id', role: 'MEMBER' });
  });

  it('accepts matching proxy secret and OpenAI identity headers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SITES_AUTH_SHARED_SECRET', 'shared-sites-auth-secret');
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(undefined),
    };
    const auth = {
      resolveOpenAiUser: vi.fn(async (identity) => ({
        id: 'db-user',
        ...identity,
        role: 'MEMBER',
      })),
    };
    const guard = new AccessGuard(reflector as never, auth as never);
    await expect(
      guard.canActivate(
        contextWith({
          'x-careerground-sites-secret': 'shared-sites-auth-secret',
          'oai-authenticated-user-id': 'site-user',
          'oai-authenticated-user-email': 'member@example.com',
        }).context,
      ),
    ).resolves.toBe(true);
  });

  it('allows an explicitly public endpoint without parsing identity headers', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new AccessGuard(reflector as never, {} as never);
    await expect(guard.canActivate(contextWith().context)).resolves.toBe(true);
  });
});
