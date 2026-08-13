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
    const winners = new Map<number, Record<string, unknown>>();
    const problems = [
      { id: 'problem-1', displayTitle: '동시성 Lv. 1', level: 1 },
      { id: 'problem-2', displayTitle: '동시성 Lv. 2', level: 2 },
    ];
    const dailyChallenge = {
      findUnique: async ({ where }: { where: { kstDate_levelSlot: { levelSlot: number } } }) =>
        winners.get(where.kstDate_levelSlot.levelSlot) || null,
      findMany: async () => [],
      create: async ({ data }: { data: { levelSlot: number; problemId: string } }) => {
        await Promise.resolve();
        if (winners.has(data.levelSlot)) throw new Error('unique constraint');
        const winner = {
          id: `challenge-${data.levelSlot}`,
          ...data,
          problem: problems.find((problem) => problem.id === data.problemId),
        };
        winners.set(data.levelSlot, winner);
        return winner;
      },
    };
    const prisma = {
      dailyChallenge,
      dailyChallengeSetting: {
        upsert: async () => ({
          allowedLevels: [1, 2],
          repeatExclusionDays: 60,
          allowRepeatRelaxation: false,
        }),
      },
      codingProblem: {
        findMany: async ({ where }: { where: { level: number } }) =>
          problems.filter((problem) => problem.level === where.level),
      },
      user: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 0 }) },
    };
    const service = new CodingService(prisma as never, {} as never);
    const [first, second] = await Promise.all([
      service.ensureTodayChallenges(new Date('2026-08-12T01:00:00Z')),
      service.ensureTodayChallenges(new Date('2026-08-12T01:00:00Z')),
    ]);
    expect(first).toEqual(second);
    expect(first).toEqual([
      expect.objectContaining({ id: 'challenge-1', levelSlot: 1 }),
      expect.objectContaining({ id: 'challenge-2', levelSlot: 2 }),
    ]);
  });

  it('selects exact Lv. 1 and Lv. 2 candidates with the repeat exclusion cutoff', async () => {
    const candidates = [
      { id: 'problem-1', displayTitle: '레벨 1 문제', level: 1 },
      { id: 'problem-2', displayTitle: '레벨 2 문제', level: 2 },
    ];
    const candidateQuery = vi.fn(async ({ where }: { where: { level: number } }) =>
      candidates.filter((problem) => problem.level === where.level),
    );
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
        upsert: async () => ({
          allowedLevels: [1, 2],
          repeatExclusionDays: 30,
          allowRepeatRelaxation: false,
        }),
      },
      codingProblem: { findMany: candidateQuery },
      user: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 0 }) },
    };
    const service = new CodingService(prisma as never, {} as never);
    const result = await service.ensureTodayChallenges(new Date('2026-08-12T01:00:00Z'));
    expect(result.map((challenge) => challenge.levelSlot)).toEqual([1, 2]);
    expect(candidateQuery).toHaveBeenCalledWith({
      where: { active: true, level: 1, id: { notIn: ['recent-problem'] } },
    });
    expect(candidateQuery).toHaveBeenCalledWith({
      where: { active: true, level: 2, id: { notIn: ['recent-problem'] } },
    });
    const recentFilter = challengeQuery.mock.calls[0]?.[0] as {
      where: { kstDate: { gte: Date } };
    };
    expect(recentFilter.where.kstDate.gte.toISOString()).toBe('2026-07-13T00:00:00.000Z');
  });

  it('relaxes only the repeat window when an ADMIN explicitly allows it and records an audit', async () => {
    const levelOne = { id: 'problem-relaxed-1', displayTitle: '완화 후보', level: 1 };
    const levelTwo = { id: 'problem-2', displayTitle: 'Lv. 2 후보', level: 2 };
    let levelOneCalls = 0;
    const candidateQuery = vi.fn(async ({ where }: { where: { level: number } }) => {
      if (where.level === 2) return [levelTwo];
      levelOneCalls += 1;
      return levelOneCalls === 1 ? [] : [levelOne];
    });
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
          allowedLevels: [1, 2],
          repeatExclusionDays: 60,
          allowRepeatRelaxation: true,
        }),
      },
      codingProblem: { findMany: candidateQuery },
      user: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 0 }) },
    };
    const service = new CodingService(prisma as never, audit as never);
    const result = await service.ensureTodayChallenges(new Date('2026-08-12T01:00:00Z'));
    expect(result[0]).toMatchObject({ repeatWindowDays: 30, allowedLevels: [1] });
    expect(result[1]).toMatchObject({ repeatWindowDays: 60, allowedLevels: [2] });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DAILY_CHALLENGE_REPEAT_WINDOW_RELAXED' }),
    );
    expect(candidateQuery).toHaveBeenCalledTimes(3);
  });
});
