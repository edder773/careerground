import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalD1 } from './local-d1.js';
import { dailyChallenges, slackDigest } from './d1-daily-challenges.js';
import { formatSlackMessages } from '../../scripts/slack/send-daily-digest.mjs';
import {
  isVerifiedCodingProblem,
  verifiedCodingMetadata,
} from '../../shared/verified-coding-problem.mjs';
import { reconcileCodingCatalog } from './d1-coding-catalog-integrity.js';
import { handleD1Api } from './d1-api.js';

const url = (id: number) => `https://school.programmers.co.kr/learn/courses/30/lessons/${id}`;
const fixture = {
  date: '2026-09-14',
  siteUrl: 'https://careerground.example/',
  jobs: [],
  challenges: [
    { title: 'SQL mislabeled in DB', sourceUrl: url(132203), track: 'ALGORITHM', level: 1 },
    { title: 'Lv2', sourceUrl: url(12914), track: 'ALGORITHM', level: 2 },
    { title: 'Lv3', sourceUrl: url(43162), track: 'ALGORITHM', level: 3, isChallenge: true },
    { title: 'SQL', sourceUrl: url(131116), track: 'SQL', level: 4 },
  ],
};

describe('source-verified daily challenge boundaries', () => {
  let db: LocalD1;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-14T00:00:00Z'));
    db = new LocalD1();
  });
  afterEach(() => {
    db.close();
    vi.useRealTimers();
  });

  it('repairs a cached SQL lesson even when its database track says ALGORITHM', async () => {
    await db
      .prepare(
        `INSERT INTO daily_challenges
      (id, kst_date, level_slot, problem_id, created_at) VALUES (?, ?, 1, ?, ?)`,
      )
      .bind('bad-cached', '2026-09-14', 'problem-programmers-132203', '2026-09-14T00:00:00Z')
      .run();
    const result = await dailyChallenges(db);
    expect(result.find((row) => row.levelSlot === 1)?.problem.sourceUrl).not.toBe(url(132203));
  });

  it('rejects the same mislabeled SQL source before Slack formatting', () => {
    expect(() => formatSlackMessages(fixture, { baeumzipUrl: 'https://modumunje.com/' })).toThrow(
      /verified|검증|분류/iu,
    );
  });

  it('checks all catalog entries and repairs exactly the verified metadata drift, idempotently', async () => {
    const before = await reconcileCodingCatalog(db);
    expect(before).toMatchObject({ scanned: 427, updated: 0, unverifiedIds: [] });
    expect(before.differences).toEqual([
      {
        id: 'problem-programmers-132203',
        before: { track: 'ALGORITHM', level: 1 },
        after: { track: 'SQL', level: 1 },
      },
    ]);
    const jobs = await db.prepare('SELECT COUNT(*) AS count FROM jobs').first();
    expect(await reconcileCodingCatalog(db, true)).toMatchObject({ updated: 1 });
    expect(await reconcileCodingCatalog(db, true)).toMatchObject({ updated: 0, differences: [] });
    expect(await db.prepare('SELECT COUNT(*) AS count FROM jobs').first()).toEqual(jobs);
  });

  it('does not select a mislabeled SQL candidate when the valid catalog is exhausted', async () => {
    await db
      .prepare(
        "UPDATE coding_problems SET active = 0 WHERE track = 'ALGORITHM' AND level = 1 AND id <> 'problem-programmers-132203'",
      )
      .run();
    await expect(dailyChallenges(db)).rejects.toThrow('후보가 없습니다');
    expect(await db.prepare('SELECT COUNT(*) AS count FROM daily_challenges').first()).toEqual({
      count: 0,
    });
  });

  it('uses only verified candidates even after the repeat exclusion fallback', async () => {
    await db
      .prepare(
        "UPDATE coding_problems SET active = 0 WHERE track = 'ALGORITHM' AND level = 1 AND id NOT IN ('problem-programmers-132203', 'problem-programmers-12935')",
      )
      .run();
    await db
      .prepare(
        `INSERT INTO daily_challenges (id, kst_date, level_slot, problem_id, created_at)
      VALUES ('old-valid', '2026-09-13', 1, 'problem-programmers-12935', '2026-09-13T00:00:00Z')`,
      )
      .run();
    const result = await dailyChallenges(db);
    expect(result.find((row) => row.levelSlot === 1)?.problem.sourceUrl).toBe(url(12935));
  });

  it('reselects a SQL problem falsely cached as the Slack-only Lv3 algorithm', async () => {
    await db
      .prepare(
        "UPDATE coding_problems SET track = 'ALGORITHM' WHERE id = 'problem-programmers-157341'",
      )
      .run();
    await db
      .prepare(
        `INSERT INTO daily_challenges (id, kst_date, level_slot, problem_id, created_at)
      VALUES ('bad-lv3', '2026-09-14', 3, 'problem-programmers-157341', '2026-09-14T00:00:00Z')`,
      )
      .run();
    const digest = await slackDigest(
      db,
      new URL('https://careerground.example/api/v1/internal/slack-digest'),
    );
    expect(digest.challenges).toHaveLength(4);
    expect(digest.challenges.every(isVerifiedCodingProblem)).toBe(true);
    expect(digest.challenges[2]!.sourceUrl).not.toBe(url(157341));
  });

  it('fails closed for unknown or spoofed sources and incorrect level labels', () => {
    expect(
      verifiedCodingMetadata(
        'https://school.programmers.co.kr.evil.example/learn/courses/30/lessons/12935',
      ),
    ).toBeNull();
    expect(verifiedCodingMetadata(url(999999999))).toBeNull();
    expect(isVerifiedCodingProblem({ sourceUrl: url(12935), track: 'ALGORITHM', level: 3 })).toBe(
      false,
    );
    expect(isVerifiedCodingProblem({ sourceUrl: url(12935), track: 'ALGORITHM', level: 1 })).toBe(
      true,
    );
    const bad = structuredClone(fixture);
    bad.challenges[0]!.sourceUrl = url(999999999);
    expect(() => formatSlackMessages(bad, { baeumzipUrl: 'https://modumunje.com/' })).toThrow(
      '원문 검증',
    );
  });

  it('requires authentication and never accepts caller-supplied classifications', async () => {
    const request = () =>
      new Request('https://careerground.example/api/v1/internal/coding-catalog/reconcile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ apply: true }),
      });
    const result = await handleD1Api(request(), {
      DB: db,
      DIGEST_API_TOKEN: 'test-secret',
      REQUEST_LOGGING: 'false',
    });
    expect(result.status).toBe(401);
    expect((await reconcileCodingCatalog(db)).differences).toHaveLength(1);
  });
});
