import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AccessGuard } from './access.guard.js';

function contextWith(cookies: Record<string, string> = {}) {
  const request = { cookies } as Record<string, unknown>;
  const context = {
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AccessGuard', () => {
  it('rejects a protected endpoint without an access cookie', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValueOnce(false) };
    const guard = new AccessGuard(reflector as never, {} as never);
    await expect(guard.canActivate(contextWith().context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('blocks MEMBER from ADMIN routes and attaches a valid user', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(['ADMIN']),
    };
    const jwt = {
      verifyAsync: vi.fn(async () => ({
        sub: 'member-id',
        email: 'member@careerground.local',
        displayName: '멤버',
        role: 'MEMBER',
      })),
    };
    const request = contextWith({ cg_access: 'signed-token' });
    const guard = new AccessGuard(reflector as never, jwt as never);
    await expect(guard.canActivate(request.context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(request.request.user).toMatchObject({ id: 'member-id', role: 'MEMBER' });
  });

  it('allows an explicitly public endpoint without parsing a token', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new AccessGuard(reflector as never, {} as never);
    await expect(guard.canActivate(contextWith().context)).resolves.toBe(true);
  });
});
