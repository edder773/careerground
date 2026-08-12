import { describe, expect, it, vi } from 'vitest';
import {
  denseRank,
  kstCalendarDate,
  mayEditComment,
  selectDeterministicProblem,
  solvedCounts,
} from './coding-domain.js';
import { cleanMarkdown, CodingService } from './coding.service.js';

describe('coding policies', () => {
  it('uses the KST calendar date across the UTC boundary', () => {
    expect(kstCalendarDate(new Date('2026-08-11T15:01:00Z')).toISOString()).toBe(
      '2026-08-12T00:00:00.000Z',
    );
    expect(kstCalendarDate(new Date('2026-08-11T14:59:00Z')).toISOString()).toBe(
      '2026-08-11T00:00:00.000Z',
    );
  });

  it('selects the same problem for the same seed', () => {
    const candidates = [{ id: 'b' }, { id: 'a' }, { id: 'c' }];
    expect(selectDeterministicProblem(candidates, '2026-08-12')?.id).toBe(
      selectDeterministicProblem(candidates, '2026-08-12')?.id,
    );
  });

  it('counts a solved problem once across revisions and uses dense rank', () => {
    const rows = [
      { userId: 'u1', problemId: 'p1', solvedAt: new Date(), code: 'a' },
      { userId: 'u1', problemId: 'p1', solvedAt: new Date(), code: 'b' },
      { userId: 'u2', problemId: 'p2', solvedAt: new Date(), code: 'c' },
    ];
    expect(solvedCounts(rows).get('u1')).toBe(1);
    expect(denseRank([{ score: 2 }, { score: 2 }, { score: 1 }]).map((x) => x.rank)).toEqual([
      1, 1, 2,
    ]);
  });

  it('only lets authors or admins edit comments', () => {
    expect(mayEditComment({ id: 'a', role: 'MEMBER' }, 'a')).toBe(true);
    expect(mayEditComment({ id: 'b', role: 'MEMBER' }, 'a')).toBe(false);
    expect(mayEditComment({ id: 'b', role: 'ADMIN' }, 'a')).toBe(true);
  });

  it('removes executable HTML while preserving markdown text', () => {
    expect(cleanMarkdown('**설명** <script>alert(1)</script><img src=x onerror=alert(2)>')).toBe(
      '**설명**',
    );
  });

  it('returns the unique winner when two workers create today concurrently', async () => {
    let winner: Record<string, unknown> | null = null;
    const problem = { id: 'problem-1', displayTitle: '동시성 문제', level: 1 };
    const dailyChallenge = {
      findUnique: async () => winner,
      findMany: async () => [],
      create: async () => {
        await Promise.resolve();
        if (winner) throw new Error('unique constraint');
        winner = { id: 'challenge-1', problem };
        return winner;
      },
    };
    const prisma = {
      dailyChallenge,
      dailyChallengeSetting: {
        upsert: async () => ({ allowedLevels: [1], repeatExclusionDays: 60 }),
      },
      codingProblem: { findMany: async () => [problem] },
      user: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 0 }) },
    };
    const service = new CodingService(prisma as never, {} as never);
    const [first, second] = await Promise.all([
      service.ensureTodayChallenge(new Date('2026-08-12T01:00:00Z')),
      service.ensureTodayChallenge(new Date('2026-08-12T01:00:00Z')),
    ]);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ id: 'challenge-1' });
  });

  it('applies allowed levels and the repeat exclusion cutoff to candidate selection', async () => {
    const candidateQuery = vi.fn(async (_input: unknown) => [
      { id: 'problem-2', displayTitle: '레벨 문제', level: 2 },
    ]);
    const challengeQuery = vi.fn(async (_input: unknown) => [{ problemId: 'recent-problem' }]);
    const prisma = {
      dailyChallenge: {
        findUnique: async () => null,
        findMany: challengeQuery,
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'challenge-2',
          ...data,
        }),
      },
      dailyChallengeSetting: {
        upsert: async () => ({ allowedLevels: [2, 3], repeatExclusionDays: 30 }),
      },
      codingProblem: { findMany: candidateQuery },
      user: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 0 }) },
    };
    const service = new CodingService(prisma as never, {} as never);
    await service.ensureTodayChallenge(new Date('2026-08-12T01:00:00Z'));
    expect(candidateQuery).toHaveBeenCalledWith({
      where: { active: true, level: { in: [2, 3] }, id: { notIn: ['recent-problem'] } },
    });
    const recentFilter = challengeQuery.mock.calls[0]?.[0] as {
      where: { kstDate: { gte: Date } };
    };
    expect(recentFilter.where.kstDate.gte.toISOString()).toBe('2026-07-13T00:00:00.000Z');
  });

  it('relaxes only the repeat window when an ADMIN explicitly allows it and records an audit', async () => {
    const problem = { id: 'problem-relaxed', displayTitle: '완화 후보', level: 2 };
    const candidateQuery = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([problem]);
    const audit = { record: vi.fn(async () => ({})) };
    const prisma = {
      dailyChallenge: {
        findUnique: async () => null,
        findMany: async () => [{ problemId: 'recent-problem' }],
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'challenge-relaxed',
          ...data,
        }),
      },
      dailyChallengeSetting: {
        upsert: async () => ({
          allowedLevels: [2],
          repeatExclusionDays: 60,
          allowRepeatRelaxation: true,
        }),
      },
      codingProblem: { findMany: candidateQuery },
      user: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 0 }) },
    };
    const service = new CodingService(prisma as never, audit as never);
    const result = await service.ensureTodayChallenge(new Date('2026-08-12T01:00:00Z'));
    expect(result).toMatchObject({ repeatWindowDays: 30, allowedLevels: [2] });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DAILY_CHALLENGE_REPEAT_WINDOW_RELAXED' }),
    );
    expect(candidateQuery).toHaveBeenCalledTimes(2);
  });
});
