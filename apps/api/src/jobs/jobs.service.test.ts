import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';
import { JobsService } from './jobs.service.js';

describe('JobsService list', () => {
  function service() {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { jobPosting: { findMany } } as unknown as PrismaService;
    return {
      findMany,
      jobs: new JobsService(prisma, {} as AuditService),
    };
  }

  it('applies an exclusive deadline range and selects only list fields', async () => {
    const { jobs, findMany } = service();
    await jobs.list('user-id', {
      sort: 'deadline',
      deadlineFrom: '2026-08-31T15:00:00.000Z',
      deadlineTo: '2026-09-30T15:00:00.000Z',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deadlineAt: {
            gte: new Date('2026-08-31T15:00:00.000Z'),
            lt: new Date('2026-09-30T15:00:00.000Z'),
          },
        }),
        select: expect.objectContaining({
          id: true,
          sourceUrl: true,
          company: { select: { name: true, size: true } },
        }),
      }),
    );
  });

  it('rejects reversed deadline ranges', async () => {
    const { jobs } = service();
    await expect(
      jobs.list('user-id', {
        deadlineFrom: '2026-10-01T00:00:00.000Z',
        deadlineTo: '2026-09-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns distinct active entry-level categories', async () => {
    const findMany = vi.fn().mockResolvedValue([{ category: 'AI 풀스택 개발' }]);
    const prisma = { jobPosting: { findMany } } as unknown as PrismaService;
    const jobs = new JobsService(prisma, {} as AuditService);

    await expect(jobs.categories()).resolves.toEqual(['AI 풀스택 개발']);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ distinct: ['category'], select: { category: true }, take: 100 }),
    );
  });
});
