import { UnauthorizedException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('provisions a new MEMBER from an OpenAI Sites identity', async () => {
    const user = {
      id: 'db-user',
      openAiUserId: 'site-user',
      email: 'member@example.com',
      displayName: '멤버',
      role: 'MEMBER',
      isActive: true,
      deletedAt: null,
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue(user),
      },
    };
    const audit = { record: vi.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as never, audit as never);
    await expect(
      service.resolveOpenAiUser({
        userId: 'site-user',
        email: 'member@example.com',
        displayName: '멤버',
      }),
    ).resolves.toEqual({
      id: 'db-user',
      email: 'member@example.com',
      displayName: '멤버',
      role: 'MEMBER',
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ openAiUserId: 'site-user', role: 'MEMBER' }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'OPENAI_ACCOUNT_CREATED' }),
    );
  });

  it('refuses to relink an email already bound to another OpenAI user', async () => {
    const prisma = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ openAiUserId: 'another-site-user' }),
      },
    };
    const service = new AuthService(prisma as never, {} as never);
    await expect(
      service.resolveOpenAiUser({
        userId: 'site-user',
        email: 'member@example.com',
        displayName: '멤버',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('links an existing seed email on its first real OpenAI login', async () => {
    const seedUser = {
      id: 'seed-user',
      openAiUserId: null,
      email: 'admin@example.com',
      displayName: '데모 관리자',
      role: 'ADMIN',
      isActive: true,
      deletedAt: null,
    };
    const linkedUser = { ...seedUser, openAiUserId: 'real-site-user' };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(seedUser),
        update: vi.fn().mockResolvedValue(linkedUser),
      },
    };
    const audit = { record: vi.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as never, audit as never);
    await expect(
      service.resolveOpenAiUser({
        userId: 'real-site-user',
        email: 'admin@example.com',
        displayName: '실제 관리자',
      }),
    ).resolves.toMatchObject({ id: 'seed-user', role: 'ADMIN' });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'seed-user' },
        data: expect.objectContaining({ openAiUserId: 'real-site-user' }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'OPENAI_IDENTITY_LINKED' }),
    );
  });
});
