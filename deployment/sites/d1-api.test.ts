import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleD1Api, runScheduledMaintenance } from './d1-api.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

const adminHeaders = {
  'x-test-google-sub': 'google-admin',
  'x-test-google-email': 'admin@example.test',
  'x-test-google-name': 'Admin User',
};

const memberHeaders = {
  'x-test-google-sub': 'google-member',
  'x-test-google-email': 'member@example.test',
  'x-test-google-name': 'Member User',
};

const importApproval = (preview: Record<string, unknown>, reviewedRowCount: number) => {
  const removalCount = Array.isArray(preview.removalCandidates)
    ? preview.removalCandidates.length
    : 0;
  return {
    previewToken: preview.previewToken,
    checksum: preview.checksum,
    acknowledgeAllRows: true,
    reviewedRowCount,
    acknowledgeRemovals: removalCount > 0,
    removalCount,
  };
};

describe('Sites D1 API', () => {
  let db: LocalD1;
  let sessionCookies: Map<string, string>;

  beforeEach(async () => {
    db = new LocalD1();
    sessionCookies = new Map();
    await ensureRuntimeSchema(db);
  });

  afterEach(() => db.close());

  async function visibleJobCount() {
    const row = await db
      .prepare(
        `SELECT COUNT(*) AS count
           FROM jobs
          WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
            AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
            AND (rolling = 1 OR deadline_at IS NULL OR deadline_at >= ?)`,
      )
      .bind(new Date().toISOString())
      .first<{ count: number }>();
    return Number(row?.count || 0);
  }

  async function call(
    path: string,
    init: RequestInit = {},
    headers: Record<string, string> = adminHeaders,
    env: Record<string, string> = {},
  ) {
    const environment = {
      DB: db,
      ADMIN_EMAILS: 'admin@example.test',
      AUTH_TEST_MODE: 'true',
      MAX_ACTIVE_USERS: '100',
      REQUEST_LOGGING: 'false',
      ...env,
    };
    const subject = headers['x-test-google-sub'];
    let cookie = subject ? sessionCookies.get(subject) : undefined;
    if (subject && !cookie) {
      const login = await handleD1Api(
        new Request('https://careerground.example/api/v1/auth/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            subject,
            email: headers['x-test-google-email'],
            displayName: headers['x-test-google-name'],
          }),
        }),
        environment,
      );
      expect(login.status).toBe(200);
      cookie = login.headers.get('set-cookie')?.split(';')[0];
      if (!cookie) throw new Error('Test Google login did not issue a session cookie.');
      sessionCookies.set(subject, cookie);
    }
    const requestHeaders = new Headers(init.headers);
    if (cookie) requestHeaders.set('cookie', cookie);
    if (init.body && !(init.body instanceof FormData))
      requestHeaders.set('content-type', 'application/json');
    const response = await handleD1Api(
      new Request(`https://careerground.example${path}`, { ...init, headers: requestHeaders }),
      environment,
    );
    return { response, body: (await response.json()) as Record<string, unknown> };
  }

  it('serves public catalogs, retires interactive auth, and ignores legacy identity headers', async () => {
    const health = await call('/api/v1/health', {}, {});
    expect(health.response.status).toBe(200);
    expect(health.body).toMatchObject({ status: 'ok', database: 'd1' });
    expect(health.response.headers.get('x-request-id')).toBeTruthy();
    expect(health.response.headers.get('server-timing')).toMatch(/^app;dur=\d+\.\d$/);
    expect(Number(health.response.headers.get('x-response-time-ms'))).toBeGreaterThanOrEqual(0);

    const authConfig = await call('/api/v1/auth/config', {}, {});
    expect(authConfig.response.status).toBe(404);
    expect(authConfig.body).toMatchObject({ code: 'ROUTE_RETIRED' });

    const authConfigMutation = await call(
      '/api/v1/auth/config',
      { method: 'POST', body: '{}' },
      {},
    );
    expect(authConfigMutation.response.status).toBe(404);
    expect(authConfigMutation.body).toMatchObject({ code: 'ROUTE_RETIRED' });

    const unauthenticated = await call('/api/v1/auth/me', {}, {});
    expect(unauthenticated.response.status).toBe(401);
    expect(unauthenticated.body).toMatchObject({ code: 'UNAUTHORIZED' });
    expect((await call('/api/v1/jobs', {}, {})).response.status).toBe(200);
    expect((await call('/api/v1/learning', {}, {})).response.status).toBe(200);
    expect((await call('/api/v1/coding/problems', {}, {})).response.status).toBe(200);

    const legacyOnly = await handleD1Api(
      new Request('https://careerground.example/api/v1/auth/me', {
        headers: {
          'oai-authenticated-user-id': 'legacy-openai-user',
          'oai-authenticated-user-email': 'legacy@example.test',
        },
      }),
      { DB: db, AUTH_TEST_MODE: 'true', REQUEST_LOGGING: 'false' },
    );
    expect(legacyOnly.status).toBe(401);
  });

  it('protects the Slack digest and includes jobs added after the previous delivery window', async () => {
    const token = 'test-digest-token';
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const recentCreatedAt = new Date(Date.now() - 12 * 60 * 60 * 1_000).toISOString();
    const deadline = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const timestamp = new Date().toISOString();

    await db.prepare("UPDATE jobs SET created_at = '2026-01-01T00:00:00.000Z'").run();
    const jobRows = await db
      .prepare('SELECT id FROM jobs ORDER BY id LIMIT 2')
      .all<{ id: string }>();
    expect(jobRows.results).toHaveLength(2);
    await db
      .prepare(
        `UPDATE jobs
            SET company_name = ?, title = ?, source_name = ?, source_url = ?,
                status = 'ACTIVE', career_scope = 'NEW_GRAD_ELIGIBLE', rolling = ?,
                deadline_at = ?, created_at = ?
          WHERE id = ?`,
      )
      .bind(
        '알림 대상 회사',
        '신입 백엔드 개발자',
        '공식 채용',
        'https://example.test/jobs/digest-included',
        0,
        deadline,
        recentCreatedAt,
        jobRows.results[0]!.id,
      )
      .run();
    await db
      .prepare(
        `UPDATE jobs
            SET company_name = ?, title = ?, source_url = ?,
                status = 'ACTIVE', career_scope = 'NEW_GRAD_ELIGIBLE', rolling = 1,
                deadline_at = ?, created_at = ?
          WHERE id = ?`,
      )
      .bind(
        '상시 회사',
        '상시 신입 개발자',
        'https://example.test/jobs/digest-rolling',
        deadline,
        recentCreatedAt,
        jobRows.results[1]!.id,
      )
      .run();

    await db.prepare('DELETE FROM daily_challenges WHERE kst_date = ?').bind(today).run();
    await db
      .prepare("UPDATE coding_problems SET active = 0 WHERE track = 'ALGORITHM' AND level = 3")
      .run();
    const problems = [
      ['digest-algorithm-1', '알고리즘 1', 1, 'ALGORITHM', 1],
      ['digest-algorithm-2', '알고리즘 2', 2, 'ALGORITHM', 2],
      ['digest-algorithm-3', '네트워크', 3, 'ALGORITHM', 3],
      ['digest-sql-4', 'SQL 4', 4, 'SQL', 34],
    ] as const;
    for (const [id, title, level, track, slot] of problems) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO coding_problems
             (id, source_url, display_title, level, track, tags, position, active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, '[]', ?, 1, ?, ?)`,
        )
        .bind(
          id,
          `https://school.programmers.co.kr/learn/courses/30/lessons/${slot}`,
          title,
          level,
          track,
          slot,
          timestamp,
          timestamp,
        )
        .run();
      await db
        .prepare(
          `INSERT INTO daily_challenges (id, kst_date, level_slot, problem_id, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(`challenge-${id}`, today, slot, id, timestamp)
        .run();
    }

    const missingConfiguration = await call('/api/v1/internal/slack-digest', {}, {}, {});
    expect(missingConfiguration.response.status).toBe(503);
    expect(missingConfiguration.body).toMatchObject({ code: 'DIGEST_AUTH_NOT_CONFIGURED' });

    const unauthorized = await call(
      '/api/v1/internal/slack-digest',
      { headers: { authorization: 'Bearer wrong-token' } },
      {},
      { DIGEST_API_TOKEN: token },
    );
    expect(unauthorized.response.status).toBe(401);
    expect(unauthorized.body).toMatchObject({ code: 'DIGEST_UNAUTHORIZED' });

    const digest = await call(
      '/api/v1/internal/slack-digest',
      { headers: { authorization: `Bearer ${token}` } },
      {},
      { DIGEST_API_TOKEN: token },
    );
    expect(digest.response.status).toBe(200);
    expect(digest.body).toMatchObject({
      date: today,
      siteUrl: 'https://careerground.example/',
      challenges: [
        { title: '알고리즘 1', track: 'ALGORITHM', level: 1 },
        { title: '알고리즘 2', track: 'ALGORITHM', level: 2 },
        { title: '네트워크', track: 'ALGORITHM', level: 3, isChallenge: true },
        { title: 'SQL 4', track: 'SQL', level: 4 },
      ],
      jobs: [
        {
          company: '알림 대상 회사',
          title: '신입 백엔드 개발자',
          sourceName: '공식 채용',
          sourceUrl: 'https://example.test/jobs/digest-included',
        },
      ],
    });

    const repeatedDigest = await call(
      '/api/v1/internal/slack-digest',
      { headers: { authorization: `Bearer ${token}` } },
      {},
      { DIGEST_API_TOKEN: token },
    );
    expect(repeatedDigest.body).toMatchObject({
      challenges: [
        { title: '알고리즘 1' },
        { title: '알고리즘 2' },
        { title: '네트워크', isChallenge: true },
        { title: 'SQL 4' },
      ],
    });

    const snapshotDigest = await call(
      `/api/v1/internal/slack-digest?snapshotCreatedAt=${encodeURIComponent(recentCreatedAt)}`,
      { headers: { authorization: `Bearer ${token}` } },
      {},
      { DIGEST_API_TOKEN: token },
    );
    expect(snapshotDigest.response.status).toBe(200);
    expect(snapshotDigest.body).toMatchObject({
      snapshotCreatedAt: recentCreatedAt,
      jobs: expect.arrayContaining([
        expect.objectContaining({
          company: '알림 대상 회사',
          sourceUrl: 'https://example.test/jobs/digest-included',
          rolling: 0,
        }),
        expect.objectContaining({
          company: '상시 회사',
          sourceUrl: 'https://example.test/jobs/digest-rolling',
          rolling: 1,
        }),
      ]),
    });

    const invalidSnapshot = await call(
      '/api/v1/internal/slack-digest?snapshotCreatedAt=2026-08-24',
      { headers: { authorization: `Bearer ${token}` } },
      {},
      { DIGEST_API_TOKEN: token },
    );
    expect(invalidSnapshot.response.status).toBe(400);
    expect(invalidSnapshot.body).toMatchObject({ code: 'INVALID_SNAPSHOT_CREATED_AT' });

    const siteDaily = await call('/api/v1/coding/daily-challenges', {}, memberHeaders);
    expect(siteDaily.response.status).toBe(200);
    expect(siteDaily.body).toHaveLength(3);
    expect(siteDaily.body).toEqual([
      expect.objectContaining({ levelSlot: 1 }),
      expect.objectContaining({ levelSlot: 2 }),
      expect.objectContaining({ levelSlot: 34 }),
    ]);
  });

  it('claims one Slack delivery atomically and blocks duplicate dispatch after completion', async () => {
    const token = 'test-digest-token';
    const authorized = { authorization: `Bearer ${token}` };
    const environment = { DIGEST_API_TOKEN: token };
    const firstClaim = await call(
      '/api/v1/internal/slack-digest/claim',
      { method: 'POST', headers: authorized, body: JSON.stringify({ jobsOnly: false }) },
      {},
      environment,
    );
    expect(firstClaim.response.status).toBe(200);
    expect(firstClaim.body).toMatchObject({
      status: 'claimed',
      deliveryKey: expect.stringMatching(/^daily:\d{4}-\d{2}-\d{2}$/),
      claimToken: expect.any(String),
      attemptCount: 1,
      payload: { challenges: expect.any(Array), jobs: expect.any(Array) },
    });

    const blockedClaim = await call(
      '/api/v1/internal/slack-digest/claim',
      { method: 'POST', headers: authorized, body: JSON.stringify({ jobsOnly: false }) },
      {},
      environment,
    );
    expect(blockedClaim.body).toMatchObject({
      status: 'blocked',
      deliveryStatus: 'CLAIMED',
      attemptCount: 1,
    });

    const completed = await call(
      '/api/v1/internal/slack-digest/complete',
      {
        method: 'POST',
        headers: authorized,
        body: JSON.stringify({
          deliveryKey: firstClaim.body.deliveryKey,
          claimToken: firstClaim.body.claimToken,
        }),
      },
      {},
      environment,
    );
    expect(completed.body).toEqual({ status: 'sent', deliveryKey: firstClaim.body.deliveryKey });

    const alreadySent = await call(
      '/api/v1/internal/slack-digest/claim',
      { method: 'POST', headers: authorized, body: JSON.stringify({ jobsOnly: false }) },
      {},
      environment,
    );
    expect(alreadySent.body).toMatchObject({ status: 'already-sent', deliveryStatus: 'SENT' });
    const delivery = await db
      .prepare(
        `SELECT status, attempt_count AS attemptCount, completed_at AS completedAt
           FROM slack_digest_deliveries WHERE delivery_key = ?`,
      )
      .bind(firstClaim.body.deliveryKey)
      .first<{ status: string; attemptCount: number; completedAt: string | null }>();
    expect(delivery).toMatchObject({ status: 'SENT', attemptCount: 1 });
    expect(delivery?.completedAt).toBeTruthy();
  });

  it('keeps the daily delivery unclaimed until a current-KST-day jobs import is committed', async () => {
    const token = 'test-digest-token';
    const authorized = { authorization: `Bearer ${token}` };
    const environment = { DIGEST_API_TOKEN: token };
    await db.prepare("DELETE FROM import_batches WHERE kind IN ('jobs', 'jobs-v5')").run();
    const request = () =>
      call(
        '/api/v1/internal/slack-digest/claim',
        {
          method: 'POST',
          headers: authorized,
          body: JSON.stringify({ requireFreshJobs: true }),
        },
        {},
        environment,
      );

    const waiting = await request();
    expect(waiting.body).toMatchObject({
      status: 'not-ready',
      reason: 'job-import-not-ready',
      deliveryKey: expect.stringMatching(/^daily:\d{4}-\d{2}-\d{2}$/),
    });
    expect(
      await db
        .prepare('SELECT COUNT(*) AS count FROM slack_digest_deliveries')
        .first<{ count: number }>(),
    ).toMatchObject({ count: 0 });

    await db
      .prepare(
        `INSERT INTO import_batches
           (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'jobs-v5', ?, 'COMMITTED', 0, 0, '{}', ?, ?)`,
      )
      .bind(
        'old-jobs-import',
        'old-jobs-import-checksum',
        '2026-01-01T06:00:00+09:00',
        '2026-01-01T06:00:00+09:00',
      )
      .run();
    expect((await request()).body).toMatchObject({ status: 'not-ready' });

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const committedAtWithOffset = `${today}T06:00:00+09:00`;
    await db
      .prepare(
        `INSERT INTO import_batches
           (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'jobs-v5', ?, 'COMMITTED', 0, 0, '{}', ?, ?)`,
      )
      .bind(
        'today-jobs-v5-import',
        'today-jobs-import-checksum',
        committedAtWithOffset,
        committedAtWithOffset,
      )
      .run();
    expect((await request()).body).toMatchObject({
      status: 'claimed',
      deliveryKey: `daily:${today}`,
      attemptCount: 1,
    });
  });

  it('allows a retry only after an explicit Slack rejection', async () => {
    const token = 'test-digest-token';
    const authorized = { authorization: `Bearer ${token}` };
    const environment = { DIGEST_API_TOKEN: token };
    const firstClaim = await call(
      '/api/v1/internal/slack-digest/claim',
      { method: 'POST', headers: authorized, body: '{}' },
      {},
      environment,
    );
    const failed = await call(
      '/api/v1/internal/slack-digest/fail',
      {
        method: 'POST',
        headers: authorized,
        body: JSON.stringify({
          deliveryKey: firstClaim.body.deliveryKey,
          claimToken: firstClaim.body.claimToken,
          error: 'Slack HTTP 500',
        }),
      },
      {},
      environment,
    );
    expect(failed.body).toMatchObject({ status: 'failed' });

    const retry = await call(
      '/api/v1/internal/slack-digest/claim',
      { method: 'POST', headers: authorized, body: '{}' },
      {},
      environment,
    );
    expect(retry.body).toMatchObject({ status: 'claimed', attemptCount: 2 });
    expect(retry.body.claimToken).not.toBe(firstClaim.body.claimToken);
  });

  it('repairs an SQL problem stored in an algorithm slot and blocks SQL manual reselection', async () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const invalidProblemId = 'problem-programmers-133025';
    await db.prepare('DELETE FROM daily_challenges WHERE kst_date = ?').bind(today).run();
    await db
      .prepare("UPDATE coding_problems SET track = 'SQL' WHERE id = ?")
      .bind(invalidProblemId)
      .run();
    await db
      .prepare(
        `INSERT INTO daily_challenges (id, kst_date, level_slot, problem_id, created_at)
         VALUES ('invalid-sql-level-one', ?, 1, ?, ?)`,
      )
      .bind(today, invalidProblemId, new Date().toISOString())
      .run();

    const repaired = await call('/api/v1/coding/daily-challenges');
    expect(repaired.response.status).toBe(200);
    expect(repaired.body).toEqual([
      expect.objectContaining({
        levelSlot: 1,
        problem: expect.objectContaining({ level: 1, track: 'ALGORITHM' }),
      }),
      expect.objectContaining({
        levelSlot: 2,
        problem: expect.objectContaining({ level: 2, track: 'ALGORITHM' }),
      }),
      expect.objectContaining({
        levelSlot: 34,
        problem: expect.objectContaining({ track: 'SQL' }),
      }),
    ]);
    const invalidRows = await db
      .prepare('SELECT id FROM daily_challenges WHERE id = ?')
      .bind('invalid-sql-level-one')
      .all();
    expect(invalidRows.results).toHaveLength(0);

    const rejected = await call('/api/v1/coding/daily-challenge/reselect', {
      method: 'POST',
      body: JSON.stringify({ problemId: invalidProblemId, confirmKstDate: today }),
    });
    expect(rejected.response.status).toBe(422);
    expect(rejected.body).toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('rate limits each user and normalized route with Retry-After', async () => {
    const env = { RATE_LIMIT_READS_PER_MINUTE: '2' };
    expect((await call('/api/v1/auth/me', {}, adminHeaders, env)).response.status).toBe(200);
    expect((await call('/api/v1/auth/me', {}, adminHeaders, env)).response.status).toBe(200);
    const limited = await call('/api/v1/auth/me', {}, adminHeaders, env);
    expect(limited.response.status).toBe(429);
    expect(limited.response.headers.get('retry-after')).toMatch(/^\d+$/);
    expect(limited.body).toMatchObject({
      code: 'RATE_LIMITED',
      details: { limit: 2, windowSeconds: 60 },
    });

    expect((await call('/api/v1/auth/me', {}, memberHeaders, env)).response.status).toBe(200);
  });

  it('revokes the opaque session on logout', async () => {
    expect((await call('/api/v1/auth/me')).response.status).toBe(200);
    const logout = await call('/api/v1/auth/logout', { method: 'POST' });
    expect(logout.response.status).toBe(200);
    expect(logout.response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await call('/api/v1/auth/me')).response.status).toBe(401);
  });

  it('returns the signed-in home workspace in one bootstrap D1 batch', async () => {
    await call(
      '/api/v1/auth/onboarding',
      {
        method: 'POST',
        body: JSON.stringify({ displayName: '부트스트랩 멤버', preferredLanguage: 'javascript' }),
      },
      memberHeaders,
    );
    await call('/api/v1/coding/daily-challenges', {}, memberHeaders);

    db.resetQueryCount();
    db.resetPreparedSql();
    const loaded = await call('/api/v1/bootstrap?home=1', {}, memberHeaders);

    expect(loaded.response.status).toBe(200);
    expect(loaded.body).toMatchObject({
      user: { displayName: '부트스트랩 멤버', onboardingCompleted: true },
      home: {
        collections: [],
        dailyChallenges: [
          expect.objectContaining({ levelSlot: 1 }),
          expect.objectContaining({ levelSlot: 2 }),
          expect.objectContaining({ levelSlot: 34 }),
        ],
      },
    });
    expect(db.getQueryCount()).toBe(4);
    expect(db.preparedSql.some((sql) => /^\s*UPDATE users/i.test(sql))).toBe(false);
    expect(loaded.response.headers.get('server-timing')).toMatch(/^app;dur=\d+\.\d$/);
  });

  it('enforces the read limit inside the bootstrap batch', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);
    const env = { RATE_LIMIT_READS_PER_MINUTE: '2' };

    expect((await call('/api/v1/bootstrap', {}, memberHeaders, env)).response.status).toBe(200);
    expect((await call('/api/v1/bootstrap', {}, memberHeaders, env)).response.status).toBe(200);
    const limited = await call('/api/v1/bootstrap', {}, memberHeaders, env);

    expect(limited.response.status).toBe(429);
    expect(limited.response.headers.get('retry-after')).toMatch(/^\d+$/);
    expect(limited.body).toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('enforces the read limit inside the fast job batch', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);
    const env = { RATE_LIMIT_READS_PER_MINUTE: '1' };

    expect(
      (await call('/api/v1/jobs?sort=new&page=cursor&limit=40', {}, memberHeaders, env)).response
        .status,
    ).toBe(200);
    const limited = await call(
      '/api/v1/jobs?sort=new&page=cursor&limit=40',
      {},
      memberHeaders,
      env,
    );
    expect(limited.response.status).toBe(429);
    expect(limited.body).toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('persists a personal folder and external link', async () => {
    const created = await call('/api/v1/collections', {
      method: 'POST',
      body: JSON.stringify({
        name: '<scr<script>ipt>지원 준비</script>',
        icon: 'folder',
        color: 'violet',
      }),
    });
    expect(created.response.status).toBe(200);
    const folder = created.body as { id: string };

    const item = await call(`/api/v1/collections/${folder.id}/items`, {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'EXTERNAL_LINK',
        targetId: 'https://example.com/portfolio',
        label: '포트폴리오',
      }),
    });
    expect(item.response.status).toBe(200);

    const listed = await call('/api/v1/collections');
    expect(listed.body).toEqual([
      expect.objectContaining({
        id: folder.id,
        name: '<scr<script>ipt>지원 준비</script>',
        items: [expect.objectContaining({ label: '포트폴리오' })],
      }),
    ]);
    await call(`/api/v1/collections/${folder.id}`, { method: 'DELETE' });
    const trash = await call('/api/v1/collections/trash');
    expect(trash.body).toEqual([
      expect.objectContaining({
        id: folder.id,
        name: '<scr<script>ipt>지원 준비</script>',
        items: [],
      }),
    ]);
    await call(`/api/v1/collections/${folder.id}/restore`, { method: 'POST' });
    expect((await call('/api/v1/collections')).body).toEqual([
      expect.objectContaining({
        id: folder.id,
        items: [expect.objectContaining({ label: '포트폴리오' })],
      }),
    ]);

    const target = await call('/api/v1/collections', {
      method: 'POST',
      body: JSON.stringify({ name: '이동 대상', icon: 'folder', color: 'amber' }),
    });
    const targetFolder = target.body as { id: string };
    const secondItem = await call(`/api/v1/collections/${targetFolder.id}/items`, {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'EXTERNAL_LINK',
        targetId: 'https://example.com/resume',
        label: '이력서',
      }),
    });
    const moved = await call(`/api/v1/collections/${folder.id}/items/${item.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ targetCollectionId: targetFolder.id }),
    });
    expect(moved.body).toMatchObject({ collectionId: targetFolder.id });
    const reordered = await call(`/api/v1/collections/${targetFolder.id}/items/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ ids: [item.body.id, secondItem.body.id] }),
    });
    expect(reordered.body).toMatchObject({ ids: [item.body.id, secondItem.body.id] });
    const afterMove = (await call('/api/v1/collections')).body as unknown as Array<{
      id: string;
      items: Array<{ id: string }>;
    }>;
    expect(
      afterMove.find((entry) => entry.id === targetFolder.id)?.items.map((entry) => entry.id),
    ).toEqual([item.body.id, secondItem.body.id]);
  });

  it('removes the personal notes feature and rejects note collection items', async () => {
    const noteTables = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_schema WHERE type = 'table' AND name IN ('notes', 'note_revisions')",
      )
      .first<{ count: number }>();
    expect(noteTables?.count).toBe(0);

    expect((await call('/api/v1/notes')).response.status).toBe(404);
    const created = await call('/api/v1/collections', {
      method: 'POST',
      body: JSON.stringify({ name: '지원 준비', icon: 'folder', color: 'violet' }),
    });
    const folder = created.body as { id: string };
    const noteItem = await call(`/api/v1/collections/${folder.id}/items`, {
      method: 'POST',
      body: JSON.stringify({ itemType: 'NOTE', targetId: 'removed-note' }),
    });
    expect(noteItem.response.status).toBe(422);
  });

  it('replaces dummy records with the imported job and problem catalogs', async () => {
    const jobCount = await db
      .prepare('SELECT COUNT(*) AS count FROM jobs')
      .first<{ count: number }>();
    const currentJobCount = await db
      .prepare("SELECT COUNT(*) AS count FROM jobs WHERE status != 'EXPIRED'")
      .first<{ count: number }>();
    const expiredJobCount = await db
      .prepare("SELECT COUNT(*) AS count FROM jobs WHERE status = 'EXPIRED'")
      .first<{ count: number }>();
    const problemCount = await db
      .prepare('SELECT COUNT(*) AS count FROM coding_problems WHERE active = 1')
      .first<{ count: number }>();
    const sqlProblemCount = await db
      .prepare("SELECT COUNT(*) AS count FROM coding_problems WHERE active = 1 AND track = 'SQL'")
      .first<{ count: number }>();
    const dummyCount = await db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM jobs WHERE source_url LIKE 'https://example.com/jobs/%') +
          (SELECT COUNT(*) FROM learning_sources WHERE id = 'source-web-foundations') AS count`,
      )
      .first<{ count: number }>();

    expect(jobCount?.count).toBe(178);
    expect(currentJobCount?.count).toBe(160);
    expect(expiredJobCount?.count).toBe(18);
    expect(problemCount?.count).toBe(427);
    expect(sqlProblemCount?.count).toBe(66);
    expect(dummyCount?.count).toBe(0);

    const visibleCount = await visibleJobCount();
    const jobs = await call('/api/v1/jobs?sort=new');
    expect(jobs.response.status).toBe(200);
    expect(jobs.body).toHaveLength(visibleCount);
    expect(jobs.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: '[인턴] [서비스 로봇] Physical AI 개발자',
          company: expect.objectContaining({ name: '엑스와이지' }),
        }),
        expect.objectContaining({
          title: '신규 웹서비스를 함께 만들어갈 백엔드 개발자 채용',
          company: expect.objectContaining({ name: '㈜원시' }),
        }),
      ]),
    );
    const firstJob = (jobs.body as unknown as Array<{ id: string }>)[0];
    expect(firstJob).toBeDefined();

    await call('/api/v1/jobs/saved', {
      method: 'POST',
      body: JSON.stringify({ jobId: firstJob.id, status: 'APPLIED', memo: '지원 메모' }),
    });
    await call(`/api/v1/jobs/${firstJob.id}/bookmark`, {
      method: 'PATCH',
      body: JSON.stringify({ bookmarked: false }),
    });
    const saved = await call('/api/v1/jobs?sort=new');
    expect(saved.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstJob.id,
          bookmarked: false,
          savedBy: [expect.objectContaining({ status: 'APPLIED', memo: '지원 메모' })],
        }),
      ]),
    );
  });

  it('returns compact distinct job categories', async () => {
    const categories = await call('/api/v1/jobs/categories');
    expect(categories.response.status).toBe(200);
    expect(categories.body).toEqual(
      expect.arrayContaining(['AI_ML', 'SOFTWARE_ENGINEERING', 'WEB_DEVELOPMENT']),
    );
  });

  it('serves the job catalog and page bootstrap with one D1 dispatch each', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);
    const visibleCount = await visibleJobCount();

    db.resetQueryCount();
    db.resetBatchCount();
    const catalog = await call('/api/v1/jobs?sort=new&page=cursor&limit=40', {}, memberHeaders);
    expect(catalog.response.status).toBe(200);
    expect(catalog.body).toMatchObject({ items: expect.any(Array), total: visibleCount });
    expect(db.getQueryCount()).toBe(4);
    expect(db.getBatchCount()).toBe(1);
    expect(
      db.preparedSql.some(
        (sql) =>
          sql.includes('INDEXED BY idx_jobs_feed_collected_id') &&
          sql.includes('ORDER BY j.collected_at DESC, j.id DESC'),
      ),
    ).toBe(true);

    db.resetQueryCount();
    db.resetBatchCount();
    const bootstrap = await call(
      '/api/v1/jobs/bootstrap?sort=new&page=cursor&limit=40',
      {},
      memberHeaders,
    );
    expect(bootstrap.response.status).toBe(200);
    expect(bootstrap.body).toMatchObject({
      user: { email: 'member@example.test' },
      categories: expect.arrayContaining(['AI_ML']),
      data: { items: expect.any(Array), total: visibleCount },
    });
    expect(db.getQueryCount()).toBe(5);
    expect(db.getBatchCount()).toBe(1);

    db.resetQueryCount();
    db.resetBatchCount();
    const fullCatalog = await call('/api/v1/jobs/bootstrap?catalog=true', {}, memberHeaders);
    expect(fullCatalog.response.status).toBe(200);
    expect(fullCatalog.body).toMatchObject({
      categories: expect.arrayContaining(['AI_ML', 'WEB_DEVELOPMENT']),
      data: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
    });
    expect(fullCatalog.body.data as unknown[]).toHaveLength(visibleCount);
    expect(db.getQueryCount()).toBe(3);
    expect(db.getBatchCount()).toBe(1);
  });

  it('provisions a new user without creating in-app notifications', async () => {
    const visibleCount = await visibleJobCount();
    const newcomer = {
      ...memberHeaders,
      'x-test-google-sub': 'job-bootstrap-newcomer',
      'x-test-google-email': 'job-bootstrap-newcomer@example.test',
    };
    const bootstrap = await call(
      '/api/v1/jobs/bootstrap?sort=new&page=cursor&limit=40',
      {},
      newcomer,
    );
    expect(bootstrap.response.status).toBe(200);
    expect(bootstrap.body).toMatchObject({ data: { total: visibleCount } });
    expect(bootstrap.body).not.toHaveProperty('unreadCount');
    const notifications = await db
      .prepare('SELECT COUNT(*) AS count FROM notifications')
      .first<{ count: number }>();
    expect(notifications?.count).toBe(0);
  });

  it('serves the high-traffic read routes in one D1 dispatch each', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);
    const cases = [
      ['/api/v1/coding/problems?track=ALGORITHM&page=cursor&limit=25', 3],
      ['/api/v1/learning', 3],
      ['/api/v1/learning/due', 3],
      ['/api/v1/collections', 3],
      ['/api/v1/collections/trash', 3],
    ] as const;

    for (const [path, queryCount] of cases) {
      db.resetQueryCount();
      db.resetBatchCount();
      const result = await call(path, {}, memberHeaders);
      expect(result.response.status, path).toBe(200);
      expect(db.getQueryCount(), path).toBe(queryCount);
      expect(db.getBatchCount(), path).toBe(1);
    }
  });

  it('serves learning bootstrap and unit detail in one D1 dispatch each', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);

    db.resetQueryCount();
    db.resetBatchCount();
    const bootstrap = await call('/api/v1/learning/bootstrap', {}, memberHeaders);
    expect(bootstrap.response.status).toBe(200);
    expect(bootstrap.body).toMatchObject({
      user: { email: 'member@example.test' },
      data: expect.arrayContaining([expect.objectContaining({ units: expect.any(Array) })]),
    });
    expect(db.getQueryCount()).toBe(3);
    expect(db.getBatchCount()).toBe(1);

    const sources = bootstrap.body.data as unknown as Array<{
      units: Array<{ id: string }>;
    }>;
    const unitId = sources.flatMap((source) => source.units)[0]?.id;
    expect(unitId).toBeTruthy();

    db.resetQueryCount();
    db.resetBatchCount();
    const detail = await call(`/api/v1/learning/units/${unitId}`, {}, memberHeaders);
    expect(detail.response.status).toBe(200);
    expect(detail.body).toMatchObject({
      id: unitId,
      flashcards: expect.any(Array),
      questions: expect.any(Array),
      progress: expect.any(Array),
    });
    expect(db.getQueryCount()).toBe(6);
    expect(db.getBatchCount()).toBe(1);
  });

  it('returns stable cursor pages and totals for large shared catalogs', async () => {
    const visibleCount = await visibleJobCount();
    const firstProblems = await call(
      '/api/v1/coding/problems?track=ALGORITHM&page=cursor&limit=25',
    );
    const problemPage = firstProblems.body as unknown as {
      items: Array<{ id: string }>;
      nextCursor: string;
      total: number;
    };
    expect(problemPage.items).toHaveLength(25);
    expect(problemPage.total).toBe(361);
    expect(problemPage.nextCursor).toBeTruthy();
    const nextProblems = await call(
      `/api/v1/coding/problems?track=ALGORITHM&page=cursor&limit=25&cursor=${encodeURIComponent(problemPage.nextCursor)}`,
    );
    const nextProblemPage = nextProblems.body as unknown as { items: Array<{ id: string }> };
    expect(nextProblemPage.items).toHaveLength(25);
    expect(nextProblemPage.items.map((item) => item.id)).not.toContain(
      problemPage.items.at(-1)?.id,
    );

    const firstJobs = await call('/api/v1/jobs?sort=new&page=cursor&limit=10');
    const jobPage = firstJobs.body as unknown as {
      items: Array<{ id: string }>;
      nextCursor: string;
      total: number;
    };
    expect(jobPage.items).toHaveLength(10);
    expect(jobPage.total).toBe(visibleCount);
    expect(jobPage.nextCursor).toBeTruthy();
    const nextJobs = await call(
      `/api/v1/jobs?sort=new&page=cursor&limit=10&cursor=${encodeURIComponent(jobPage.nextCursor)}`,
    );
    expect((nextJobs.body as unknown as { items: unknown[] }).items).toHaveLength(10);
    expect(
      (nextJobs.body as unknown as { items: Array<{ id: string }> }).items.map((item) => item.id),
    ).not.toContain(jobPage.items.at(-1)?.id);
  });

  it('retires solved status and memo mutations from the recommendation-only catalog', async () => {
    const catalog = await call(
      '/api/v1/coding/problems?track=ALGORITHM&page=cursor&limit=25',
      {},
      memberHeaders,
    );
    const firstProblem = (
      catalog.body as unknown as { items: Array<{ id: string; displayTitle: string }> }
    ).items[0];
    expect(firstProblem).toBeTruthy();

    const status = await call(
      `/api/v1/coding/problems/${firstProblem!.id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status: 'SOLVED' }) },
      memberHeaders,
    );
    const memo = await call(
      `/api/v1/coding/problems/${firstProblem!.id}/memo`,
      { method: 'PATCH', body: JSON.stringify({ memo: 'retired' }) },
      memberHeaders,
    );
    expect(status.response.status).toBe(404);
    expect(memo.response.status).toBe(404);
  });

  it('returns only the signed-in user favorite problems when the favorite scope is requested', async () => {
    const catalog = await call(
      '/api/v1/coding/problems?track=ALGORITHM&page=cursor&limit=25',
      {},
      memberHeaders,
    );
    const firstProblem = (
      catalog.body as unknown as { items: Array<{ id: string; displayTitle: string }> }
    ).items[0];
    expect(firstProblem).toBeTruthy();

    await call(
      `/api/v1/coding/problems/${firstProblem!.id}/favorite`,
      {
        method: 'PATCH',
        body: JSON.stringify({ favorite: true }),
      },
      memberHeaders,
    );

    const favorites = await call(
      '/api/v1/coding/problems?favorites=1&track=ALGORITHM&page=cursor&limit=25',
      {},
      memberHeaders,
    );
    expect(favorites.body).toMatchObject({
      total: 1,
      nextCursor: null,
      items: [
        {
          id: firstProblem!.id,
          progress: [{ favorite: true }],
        },
      ],
    });

    const otherUser = await call(
      '/api/v1/coding/problems?favorites=1&track=ALGORITHM&page=cursor&limit=25',
    );
    expect(otherUser.body).toMatchObject({ total: 0, nextCursor: null, items: [] });
  });

  it('accepts repeated company-size and category filters', async () => {
    const sizes = await call('/api/v1/jobs?companySize=UNCLASSIFIED&companySize=FOREIGN');
    const sizeRows = sizes.body as unknown as Array<{ company: { size: string } }>;
    expect(sizeRows.length).toBeGreaterThan(0);
    expect(sizeRows.every((row) => ['UNCLASSIFIED', 'FOREIGN'].includes(row.company.size))).toBe(
      true,
    );

    const categories = await call('/api/v1/jobs?category=AI_ML&category=WEB_DEVELOPMENT');
    const categoryRows = categories.body as unknown as Array<{ category: string }>;
    expect(categoryRows.length).toBeGreaterThan(0);
    expect(categoryRows.every((row) => ['AI_ML', 'WEB_DEVELOPMENT'].includes(row.category))).toBe(
      true,
    );
  });

  it('shares catalog data while isolating each member activity record', async () => {
    const adminJobs = await call('/api/v1/jobs?sort=new');
    const memberJobs = await call('/api/v1/jobs?sort=new', {}, memberHeaders);
    const adminRows = adminJobs.body as unknown as Array<{ id: string }>;
    const memberRows = memberJobs.body as unknown as Array<{
      id: string;
      savedBy: Array<{ status: string }>;
    }>;
    expect(memberRows.map((row) => row.id)).toEqual(adminRows.map((row) => row.id));

    await call('/api/v1/jobs/saved', {
      method: 'POST',
      body: JSON.stringify({ jobId: adminRows[0].id, status: 'APPLIED', memo: '' }),
    });
    const isolatedJobs = await call('/api/v1/jobs?sort=new', {}, memberHeaders);
    expect(
      (isolatedJobs.body as unknown as Array<{ id: string; savedBy: unknown[] }>).find(
        (row) => row.id === adminRows[0].id,
      )?.savedBy,
    ).toEqual([]);

    const adminLearning = await call('/api/v1/learning');
    const unitId = (adminLearning.body as unknown as Array<{ units: Array<{ id: string }> }>)[0]
      .units[0].id;
    await call('/api/v1/learning/review', {
      method: 'POST',
      body: JSON.stringify({ unitId, rating: 5 }),
    });
    const memberLearning = await call('/api/v1/learning', {}, memberHeaders);
    const memberUnit = (
      memberLearning.body as unknown as Array<{
        units: Array<{ id: string; progress: unknown[] }>;
      }>
    )
      .flatMap((source) => source.units)
      .find((unit) => unit.id === unitId);
    expect(memberUnit?.progress).toEqual([]);

    const adminChallenges = await call('/api/v1/coding/daily-challenges');
    const memberChallenges = await call('/api/v1/coding/daily-challenges', {}, memberHeaders);
    expect(memberChallenges.body).toEqual(adminChallenges.body);
  });

  it('loads all existing daily challenges with one joined catalog query', async () => {
    const prepared = await call('/api/v1/coding/daily-challenges', {}, memberHeaders);
    expect(prepared.response.status).toBe(200);

    db.resetQueryCount();
    db.resetBatchCount();
    db.resetPreparedSql();
    const repeated = await call('/api/v1/coding/daily-challenges', {}, memberHeaders);

    expect(repeated.response.status).toBe(200);
    expect(repeated.body).toHaveLength(3);
    expect(repeated.body).toEqual([
      expect.objectContaining({ levelSlot: 1, problem: expect.objectContaining({ level: 1 }) }),
      expect.objectContaining({ levelSlot: 2, problem: expect.objectContaining({ level: 2 }) }),
      expect.objectContaining({
        levelSlot: 34,
        problem: expect.objectContaining({ track: 'SQL' }),
      }),
    ]);
    expect(db.getQueryCount()).toBe(3);
    expect(db.getBatchCount()).toBe(0);
    expect(db.preparedSql.filter((sql) => sql.includes('FROM daily_challenges dc'))).toHaveLength(
      1,
    );
  });

  it('limits calendar queries to the requested deadline month', async () => {
    const august = await call(
      '/api/v1/jobs?sort=deadline&deadlineFrom=2026-07-31T15%3A00%3A00.000Z&deadlineTo=2026-08-31T15%3A00%3A00.000Z',
    );
    const augustRows = august.body as unknown as Array<{ deadlineAt: string }>;
    expect(august.response.status).toBe(200);
    expect(augustRows.length).toBeGreaterThan(0);
    expect(
      augustRows.every((row) => {
        const value = Date.parse(row.deadlineAt);
        return (
          value >= Date.parse('2026-07-31T15:00:00.000Z') &&
          value < Date.parse('2026-08-31T15:00:00.000Z')
        );
      }),
    ).toBe(true);

    const september = await call(
      '/api/v1/jobs?sort=deadline&deadlineFrom=2026-08-31T15%3A00%3A00.000Z&deadlineTo=2026-09-30T15%3A00%3A00.000Z',
    );
    expect(september.response.status).toBe(200);
    const septemberRows = september.body as unknown as Array<{ deadlineAt: string }>;
    expect(septemberRows.length).toBeGreaterThan(0);
    expect(
      septemberRows.every((row) => {
        const value = Date.parse(row.deadlineAt);
        return (
          value >= Date.parse('2026-08-31T15:00:00.000Z') &&
          value < Date.parse('2026-09-30T15:00:00.000Z')
        );
      }),
    ).toBe(true);

    const invalid = await call(
      '/api/v1/jobs?deadlineFrom=2026-09-30T15%3A00%3A00.000Z&deadlineTo=2026-08-31T15%3A00%3A00.000Z',
    );
    expect(invalid.response.status).toBe(400);
  });

  it('keeps registration, application start, and collection timestamps separate', async () => {
    const candidates = await db
      .prepare("SELECT id FROM jobs WHERE rolling = 0 AND status = 'ACTIVE' ORDER BY id LIMIT 3")
      .all<{ id: string }>();
    const [published, application, collectedOnly] = candidates.results;
    expect(published && application && collectedOnly).toBeTruthy();
    await db.batch([
      db
        .prepare('UPDATE jobs SET published_at = ?, application_start_at = NULL WHERE id = ?')
        .bind('2026-08-02T00:00:00.000Z', published!.id),
      db
        .prepare('UPDATE jobs SET application_start_at = ?, published_at = NULL WHERE id = ?')
        .bind('2026-08-03T00:00:00.000Z', application!.id),
      db
        .prepare(
          'UPDATE jobs SET published_at = NULL, application_start_at = NULL, deadline_at = NULL WHERE id = ?',
        )
        .bind(collectedOnly!.id),
    ]);
    const calendar = await call(
      '/api/v1/jobs?calendar=true&sort=deadline&deadlineFrom=2026-07-31T15%3A00%3A00.000Z&deadlineTo=2026-08-31T15%3A00%3A00.000Z',
    );
    const rows = calendar.body as unknown as Array<{
      id: string;
      publishedAt: string | null;
      applicationStartAt: string | null;
      collectedAt: string;
      deadlineAt: string | null;
      rolling: boolean;
    }>;
    expect(calendar.response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.rolling)).toBe(true);
    expect(rows.some((row) => row.id === published!.id && Boolean(row.publishedAt))).toBe(true);
    expect(rows.some((row) => row.id === application!.id && Boolean(row.applicationStartAt))).toBe(
      true,
    );
    expect(rows.some((row) => row.id === collectedOnly!.id)).toBe(false);
    expect(rows.some((row) => Boolean(row.deadlineAt))).toBe(true);
  });

  it('serves recommendations and favorites while retiring solution collaboration', async () => {
    db.resetPreparedSql();
    const challenges = await call('/api/v1/coding/daily-challenges');
    expect(challenges.body).toEqual([
      expect.objectContaining({
        levelSlot: 1,
        problem: expect.objectContaining({ level: 1, track: 'ALGORITHM' }),
      }),
      expect.objectContaining({
        levelSlot: 2,
        problem: expect.objectContaining({ level: 2, track: 'ALGORITHM' }),
      }),
      expect.objectContaining({
        levelSlot: 34,
        problem: expect.objectContaining({ track: 'SQL', level: expect.any(Number) }),
      }),
    ]);
    const dailyRows = challenges.body as unknown as Array<{
      levelSlot: number;
      problem: { level: number };
    }>;
    expect([3, 4]).toContain(dailyRows.find((item) => item.levelSlot === 34)?.problem.level);
    expect(
      db.preparedSql.filter((sql) => sql.includes('FROM coding_problems p')).length,
    ).toBeLessThanOrEqual(3);

    const sqlProblems = await call('/api/v1/coding/problems?track=SQL');
    const sqlRows = sqlProblems.body as unknown as Array<{ track: string }>;
    expect(sqlRows).toHaveLength(66);
    expect(sqlRows.every((problem) => problem.track === 'SQL')).toBe(true);
    const challenge = await call('/api/v1/coding/daily-challenge');
    const daily = challenge.body as unknown as { id: string; problem: { id: string } };
    expect(daily.problem.id).toBeTruthy();

    const favorite = await call(`/api/v1/coding/problems/${daily.problem.id}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ favorite: true }),
    });
    expect(favorite.body).toEqual({ problemId: daily.problem.id, favorite: true });

    const retired = await Promise.all([
      call('/api/v1/coding/solutions'),
      call('/api/v1/coding/solutions', { method: 'POST', body: '{}' }),
      call('/api/v1/coding/rankings'),
      call('/api/v1/coding/comments/comment-id', { method: 'DELETE' }),
      call(`/api/v1/coding/daily-challenge/${daily.id}/complete`, { method: 'POST' }),
    ]);
    expect(retired.slice(0, 4).every((result) => result.response.status === 404)).toBe(true);
    expect(retired[4]?.response.status).toBe(404);
  });

  it('persists learning review state and returns searchable data', async () => {
    const reconstructed = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM learning_units WHERE source_id = 'source-generative-ai-context'",
      )
      .first<{ count: number }>();
    expect(reconstructed?.count).toBe(6);
    const payload = {
      version: '1.0',
      source: {
        title: '테스트용 웹 기초',
        subject: '소프트웨어 개발',
        category: '백엔드',
        sourceVersion: '1.0',
        checksum: 'a'.repeat(64),
      },
      units: [
        {
          anchor: 'http-api',
          title: 'HTTP API와 상태 코드',
          summaryMarkdown: 'List<String>과 a < b를 그대로 학습합니다.',
          concepts: ['HTTP'],
          flashcards: [{ front: '멱등한 요청이란?', back: '반복해도 최종 상태가 같습니다.' }],
          questions: [
            {
              type: 'SHORT_ANSWER',
              prompt: '생성 성공 상태 코드는?',
              answer: '201 Created',
            },
            {
              type: 'MULTIPLE_CHOICE',
              prompt: '멱등한 HTTP 메서드는?',
              answer: 'GET',
              choices: ['POST', 'GET', 'PATCH'],
            },
          ],
        },
      ],
    };
    const preview = await call('/api/v1/learning/import/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const token = importApproval(preview.body, payload.units.length);
    const imported = await call('/api/v1/learning/import/commit', {
      method: 'POST',
      body: JSON.stringify(token),
    });
    expect(imported.response.status).toBe(200);

    const learning = await call('/api/v1/learning');
    const source = (
      learning.body as unknown as Array<{
        title: string;
        units: Array<{ id: string; summaryPreview: string }>;
      }>
    ).find((item) => item.title === payload.source.title)!;
    expect(source.units.length).toBeGreaterThan(0);
    expect(source.units[0]).toMatchObject({
      summaryPreview: 'List<String>과 a < b를 그대로 학습합니다.',
    });
    const unitDetail = await call(`/api/v1/learning/units/${source.units[0].id}`);
    expect(unitDetail.body).toMatchObject({
      summary: 'List<String>과 a < b를 그대로 학습합니다.',
      questions: expect.arrayContaining([
        expect.objectContaining({
          type: 'MULTIPLE_CHOICE',
          choices: ['POST', 'GET', 'PATCH'],
        }),
      ]),
    });
    const multipleChoice = (
      unitDetail.body as unknown as {
        questions: Array<{ id: string; type: string }>;
      }
    ).questions.find((question) => question.type === 'MULTIPLE_CHOICE');
    expect(multipleChoice).toBeTruthy();
    const invalidChoice = await call(`/api/v1/learning/questions/${multipleChoice?.id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ response: 'DELETE' }),
    });
    expect(invalidChoice.response.status).toBe(422);
    const correctChoice = await call(`/api/v1/learning/questions/${multipleChoice?.id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ response: 'GET' }),
    });
    expect(correctChoice.body).toMatchObject({ correct: true, answer: 'GET' });
    const invalidRating = await call('/api/v1/learning/review', {
      method: 'POST',
      body: JSON.stringify({ unitId: source.units[0].id, rating: 8 }),
    });
    expect(invalidRating.response.status).toBe(422);
    await call('/api/v1/learning/review', {
      method: 'POST',
      body: JSON.stringify({ unitId: source.units[0].id, rating: 4 }),
    });

    const refreshed = await call('/api/v1/learning');
    expect(refreshed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          units: expect.arrayContaining([
            expect.objectContaining({
              id: source.units[0].id,
              progress: [expect.objectContaining({ completed: true })],
            }),
          ]),
        }),
      ]),
    );

    const search = await call('/api/v1/search?q=HTTP');
    expect(search.response.status).toBe(200);
    expect(search.body).toMatchObject({ query: 'HTTP' });
  });

  it('grades learning answers without exposing the answer before an attempt', async () => {
    const library = await call('/api/v1/learning');
    const unit = (library.body as unknown as Array<{ units: Array<{ id: string }> }>).flatMap(
      (source) => source.units,
    )[0];
    const detail = await call(`/api/v1/learning/units/${unit.id}`);
    const question = (detail.body.questions as Array<{ id: string; answer?: string }>)[0];
    expect(question).toBeDefined();
    expect(question.answer).toBeUndefined();

    const wrong = await call(`/api/v1/learning/questions/${question.id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ response: '의도적으로 틀린 답' }),
    });
    expect(wrong.body).toMatchObject({ questionId: question.id, correct: false });
    expect(wrong.body.answer).toEqual(expect.any(String));

    const refreshed = await call(`/api/v1/learning/units/${unit.id}`);
    expect(refreshed.body.questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: question.id,
          attempts: [expect.objectContaining({ correct: false })],
        }),
      ]),
    );
  });

  it('serializes review versions and schedules mastered units consistently', async () => {
    const library = await call('/api/v1/learning');
    const unitId = (library.body as unknown as Array<{ units: Array<{ id: string }> }>).flatMap(
      (source) => source.units,
    )[0].id;

    for (let index = 0; index < 3; index += 1) {
      const review = await call('/api/v1/learning/review', {
        method: 'POST',
        body: JSON.stringify({ unitId, rating: 5 }),
      });
      expect(review.response.status).toBe(200);
      expect(review.body).toMatchObject({ reviewVersion: index + 1 });
    }

    const progress = await db
      .prepare(
        'SELECT review_version AS reviewVersion, mastered_at AS masteredAt, next_review_at AS nextReviewAt FROM learning_progress WHERE unit_id = ?',
      )
      .bind(unitId)
      .first<{ reviewVersion: number; masteredAt: string | null; nextReviewAt: string | null }>();
    const events = await db
      .prepare('SELECT sequence FROM learning_review_events WHERE unit_id = ? ORDER BY sequence')
      .bind(unitId)
      .all<{ sequence: number }>();
    expect(progress).toMatchObject({ reviewVersion: 3, masteredAt: expect.any(String) });
    expect(progress?.nextReviewAt).toBeNull();
    expect(events.results.map((event) => event.sequence)).toEqual([1, 2, 3]);
  });

  it('retires in-app notifications and keeps maintenance notification-free', async () => {
    await call('/api/v1/auth/me');
    const routes = await Promise.all([
      call('/api/v1/notifications/unread-count'),
      call('/api/v1/notifications'),
      call('/api/v1/notifications/read-all', { method: 'PATCH' }),
    ]);
    expect(routes.every((result) => result.response.status === 404)).toBe(true);

    const maintenance = await runScheduledMaintenance({ DB: db });
    expect(maintenance).toMatchObject({ acquired: true });
    const notificationCount = await db
      .prepare('SELECT COUNT(*) AS count FROM notifications')
      .first<{ count: number }>();
    expect(notificationCount?.count).toBe(0);
  });

  it('keeps jobs immutable during scheduled maintenance and hides past fixed deadlines', async () => {
    await call('/api/v1/auth/me');
    const user = await db
      .prepare(
        "SELECT user_id AS id FROM auth_identities WHERE provider = 'GOOGLE' AND provider_subject = 'google-admin'",
      )
      .first<{ id: string }>();
    const unit = await db
      .prepare('SELECT id FROM learning_units WHERE published = 1 LIMIT 1')
      .first<{ id: string }>();
    const timestamp = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO learning_progress
           (id, user_id, unit_id, understanding, repetition_count, interval_days,
            next_review_at, completed, review_version, completed_at, last_studied_at, updated_at)
         VALUES (?, ?, ?, 4, 1, 1, ?, 1, 1, ?, ?, ?)`,
      )
      .bind('scheduled-progress', user!.id, unit!.id, timestamp, timestamp, timestamp, timestamp)
      .run();
    const expiredJob = await db.prepare('SELECT id FROM jobs LIMIT 1').first<{ id: string }>();
    await db
      .prepare("UPDATE jobs SET deadline_at = ?, rolling = 0, status = 'ACTIVE' WHERE id = ?")
      .bind(new Date(Date.now() - 86_400_000).toISOString(), expiredJob!.id)
      .run();
    await db
      .prepare(
        `INSERT INTO request_rate_limits (user_id, route_key, window_start, count, updated_at)
         VALUES (?, 'stale-read', ?, 1, ?)`,
      )
      .bind(user!.id, Math.floor(Date.now() / 60_000) - 10, timestamp)
      .run();

    const result = await runScheduledMaintenance({ DB: db });
    expect(result).toMatchObject({ acquired: true });
    const persistedJob = await db
      .prepare('SELECT status FROM jobs WHERE id = ?')
      .bind(expiredJob!.id)
      .first<{ status: string }>();
    expect(persistedJob?.status).toBe('ACTIVE');
    const visibleJobs = await call('/api/v1/jobs?catalog=true');
    expect(
      (visibleJobs.body as Array<{ id: string }>).some((job) => job.id === expiredJob!.id),
    ).toBe(false);
    const reviewNotifications = await db
      .prepare("SELECT COUNT(*) AS count FROM notifications WHERE type = 'LEARNING_REVIEW'")
      .first<{ count: number }>();
    expect(reviewNotifications?.count).toBe(0);
    const staleRateLimits = await db
      .prepare("SELECT COUNT(*) AS count FROM request_rate_limits WHERE route_key = 'stale-read'")
      .first<{ count: number }>();
    expect(staleRateLimits?.count).toBe(0);

    await db
      .prepare(
        "INSERT INTO scheduler_leases (name, owner_id, lease_until, updated_at) VALUES ('maintenance-cleanup', 'other-worker', ?, ?)",
      )
      .bind(new Date(Date.now() + 60_000).toISOString(), timestamp)
      .run();
    expect(await runScheduledMaintenance({ DB: db })).toEqual({ acquired: false });
  });

  it('loads the learning summary library with one bounded query', async () => {
    db.resetPreparedSql();
    const learning = await call('/api/v1/learning');
    const learningQueries = db.preparedSql.filter((sql) =>
      /FROM (learning_sources|learning_units|flashcards|learning_questions)/.test(sql),
    );

    expect(learning.response.status).toBe(200);
    expect(learningQueries).toHaveLength(1);
  });

  it('publishes all reconstructed PDF learning sources to every signed-in member', async () => {
    const adminLearning = await call('/api/v1/learning');
    const memberLearning = await call('/api/v1/learning', {}, memberHeaders);
    const titles = (adminLearning.body as unknown as Array<{ title: string }>).map(
      (source) => source.title,
    );

    expect(titles).toEqual(
      expect.arrayContaining([
        '생성형 AI 실전: Prompt와 Context Engineering',
        '데이터 분석 기초: 변수에서 가설검정까지',
        '데이터 관계 읽기: 상관과 회귀',
        '개발 입문: Git, 환경 구성, AI 코딩',
        '컨테이너 이해와 애플리케이션 컨테이너화',
        'Spring AI 이해와 활용',
        '스마트 데이터 이해와 활용',
        'Vue.js 프런트엔드 프레임워크',
        'REST API와 Spring Boot 백엔드 개발',
        'Java 백엔드 프로그래밍 기초',
        '데이터 분석을 위한 Python 이해',
        'HTML·CSS·JavaScript 웹 개발 기초',
        'LLM과 Transformer 아키텍처 I',
        'LLM과 Transformer 아키텍처 II',
      ]),
    );
    expect(memberLearning.body).toEqual(adminLearning.body);
    const units = (
      adminLearning.body as unknown as Array<{
        units: Array<{ id: string }>;
      }>
    ).flatMap((source) => source.units);
    expect(units).toHaveLength(102);
    const details = [];
    for (const unit of units) {
      details.push(await call(`/api/v1/learning/units/${unit.id}`, {}, memberHeaders));
    }
    expect(
      details.every((detail) =>
        (detail.body.visuals as Array<{ src: string }>)[0]?.src.startsWith('/learning/'),
      ),
    ).toBe(true);
    expect(
      details.every((detail) => (detail.body.visuals as Array<{ page: number }>)[0]?.page > 0),
    ).toBe(true);
  });

  it('does not expose ranking, export, or deletion request routes', async () => {
    await call('/api/v1/auth/me');
    await call('/api/v1/auth/me', {}, memberHeaders);
    const ranking = await call('/api/v1/coding/rankings');
    const exportResponse = await call('/api/v1/auth/export');
    const deletionResponse = await call('/api/v1/auth/delete-request', { method: 'POST' });
    expect(ranking.response.status).toBe(404);
    expect(exportResponse.response.status).toBe(404);
    expect(deletionResponse.response.status).toBe(404);
  });

  it('stores only the problem favorite through the public progress surface', async () => {
    const problem = await db
      .prepare('SELECT id FROM coding_problems WHERE active = 1 ORDER BY position LIMIT 1')
      .first<{ id: string }>();
    expect(problem?.id).toBeTruthy();
    const base = `/api/v1/coding/problems/${problem!.id}`;
    const favorite = await call(`${base}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ favorite: true }),
    });
    const status = await call(`${base}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const memo = await call(`${base}/memo`, {
      method: 'PATCH',
      body: JSON.stringify({ memo: 'retired' }),
    });
    expect(favorite.body).toEqual({ problemId: problem!.id, favorite: true });
    expect(status.response.status).toBe(404);
    expect(memo.response.status).toBe(404);
    const progress = await db
      .prepare('SELECT status, favorite, memo FROM problem_progress WHERE problem_id = ?')
      .bind(problem!.id)
      .first<{ status: string; favorite: number; memo: string }>();
    expect(progress).toEqual({
      status: 'UNTRIED',
      favorite: 1,
      memo: '',
    });
  });

  it('requires a matching preview token and rolls back an interrupted job import', async () => {
    const timestamp = new Date().toISOString();
    const payload = {
      version: '1.0',
      collectedAt: timestamp,
      sourceCount: 1,
      items: [
        {
          sourceName: 'regression-fixture',
          sourceUrl: 'https://example.test/jobs/atomic-1?utm_source=test',
          companyName: '주식회사 주사위게임',
          title: '신입 백엔드 개발자',
          category: '백엔드',
          careerScope: 'NEW_GRAD_ONLY',
          careerEvidence: '신입 지원 가능',
          companySize: 'SMALL',
          companySizeEvidence: '테스트 근거',
          employmentType: 'FULL_TIME',
          region: '서울',
          remote: false,
          techStack: ['TypeScript'],
          rolling: true,
          collectedAt: timestamp,
          lastVerifiedAt: timestamp,
          summary: '원자 import 회귀 테스트',
          status: 'ACTIVE',
        },
      ],
    };
    const direct = await call('/api/v1/jobs/import/commit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(direct.response.status).toBe(422);

    const preview = await call('/api/v1/jobs/import/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const approval = importApproval(preview.body, payload.items.length);
    expect(approval.previewToken).toBeTruthy();
    const changed = await call('/api/v1/jobs/import/commit', {
      method: 'POST',
      body: JSON.stringify({ ...approval, checksum: 'f'.repeat(64) }),
    });
    expect(changed.response.status).toBe(409);

    const before = await db
      .prepare('SELECT COUNT(*) AS count FROM jobs')
      .first<{ count: number }>();
    db.failNextBatch(1);
    const interrupted = await call('/api/v1/jobs/import/commit', {
      method: 'POST',
      body: JSON.stringify(approval),
    });
    expect(interrupted.response.status).toBe(500);
    const afterFailure = await db
      .prepare('SELECT COUNT(*) AS count FROM jobs')
      .first<{ count: number }>();
    expect(afterFailure?.count).toBe(before?.count);

    const committed = await call('/api/v1/jobs/import/commit', {
      method: 'POST',
      body: JSON.stringify(approval),
    });
    expect(committed.response.status).toBe(200);
    const retried = await call('/api/v1/jobs/import/commit', {
      method: 'POST',
      body: JSON.stringify(approval),
    });
    expect(retried.body).toMatchObject({ idempotent: true });
  });

  it('persists only new ACTIVE rows from an administrator job import', async () => {
    const timestamp = new Date().toISOString();
    const item = (suffix: string, status: string, companySize = 'SMALL') => ({
      sourceName: 'insert-only-fixture',
      sourceUrl: `https://example.test/jobs/insert-only-${suffix}`,
      companyName: '삽입 전용 회사',
      title: `신입 개발자 ${suffix}`,
      category: '백엔드',
      careerScope: 'NEW_GRAD_ONLY',
      careerEvidence: '신입 지원 가능',
      companySize,
      employmentType: 'FULL_TIME',
      region: '서울',
      remote: false,
      techStack: ['TypeScript'],
      rolling: true,
      collectedAt: timestamp,
      lastVerifiedAt: timestamp,
      summary: 'INSERT-only 정책 회귀 테스트',
      status,
    });
    const payload = {
      version: '1.0',
      collectedAt: timestamp,
      sourceCount: 1,
      items: [
        item('active', 'ACTIVE'),
        item('unknown', 'DEADLINE_UNKNOWN'),
        item('expired', 'EXPIRED'),
        item('review', 'NEEDS_REVIEW'),
        item('unclassified', 'ACTIVE', 'UNCLASSIFIED'),
      ],
    };
    const preview = await call('/api/v1/jobs/import/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(preview.response.status).toBe(200);
    expect(preview.body).toMatchObject({
      counts: { create: 1, rejected: 3, review: 1, update: 0, removal: 0 },
      removalCandidates: [],
    });

    const committed = await call('/api/v1/jobs/import/commit', {
      method: 'POST',
      body: JSON.stringify(importApproval(preview.body, payload.items.length)),
    });
    expect(committed.response.status).toBe(200);
    expect(committed.body).toMatchObject({ snapshot: { mode: 'INSERT_ONLY', sources: [] } });

    const rows = await db
      .prepare("SELECT status FROM jobs WHERE source_name = 'insert-only-fixture'")
      .all<{ status: string }>();
    expect(rows.results).toEqual([{ status: 'ACTIVE' }]);
  });

  it('deduplicates a source posting even when its canonical URL changes', async () => {
    const timestamp = new Date().toISOString();
    const item = (sourceUrl: string, title: string) => ({
      sourceName: 'canonical-fixture',
      sourceId: 'posting-77',
      sourceUrl,
      companyName: '식별자 회사',
      title,
      category: '백엔드',
      careerScope: 'NEW_GRAD_ONLY',
      careerEvidence: '신입 지원 가능',
      companySize: 'SMALL',
      employmentType: 'FULL_TIME',
      region: '서울',
      remote: false,
      techStack: ['TypeScript'],
      rolling: true,
      collectedAt: timestamp,
      lastVerifiedAt: timestamp,
      summary: 'canonical identity 회귀 테스트',
      status: 'ACTIVE',
    });
    const commit = async (sourceUrl: string, title: string) => {
      const payload = {
        version: '1.0',
        collectedAt: timestamp,
        sourceCount: 1,
        items: [item(sourceUrl, title)],
      };
      const preview = await call('/api/v1/jobs/import/preview', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if ((preview.body.counts as { create?: number }).create === 0) return preview;
      return call('/api/v1/jobs/import/commit', {
        method: 'POST',
        body: JSON.stringify(importApproval(preview.body, 1)),
      });
    };

    const created = await commit('https://jobs.example.test/openings/77', '처음 제목');
    expect(created.response.status).toBe(200);
    const duplicate = await commit('https://jobs.example.test/recruit/77', '변경된 제목');
    expect(duplicate.body).toMatchObject({
      counts: { create: 0, duplicate: 1 },
      rows: [
        expect.objectContaining({
          outcome: 'DUPLICATE',
          reason: '같은 출처의 공고 식별자가 이미 등록되어 있음',
        }),
      ],
    });
    const stored = await db
      .prepare(
        `SELECT COUNT(*) AS count, MIN(title) AS title,
                COUNT(DISTINCT canonical_key) AS canonicalKeys
           FROM jobs WHERE source_name = 'canonical-fixture'`,
      )
      .first<{ count: number; title: string; canonicalKeys: number }>();
    expect(stored).toEqual({ count: 1, title: '처음 제목', canonicalKeys: 1 });
  });

  it('treats full source packages as insert-only and preserves existing jobs', async () => {
    const secondTimestamp = new Date().toISOString();
    const firstTimestamp = new Date(Date.parse(secondTimestamp) - 1_000).toISOString();
    const item = (sourceUrl: string, title: string, timestamp: string) => ({
      sourceName: 'snapshot-fixture',
      sourceUrl,
      companyName: '스냅샷 회사',
      title,
      category: '백엔드',
      careerScope: 'NEW_GRAD_ONLY',
      careerEvidence: '신입 지원 가능',
      companySize: 'SMALL',
      employmentType: 'FULL_TIME',
      region: '서울',
      remote: false,
      techStack: ['TypeScript'],
      rolling: true,
      collectedAt: timestamp,
      lastVerifiedAt: timestamp,
      summary: 'authoritative snapshot fixture',
      status: 'ACTIVE',
    });
    const commit = async (timestamp: string, items: ReturnType<typeof item>[]) => {
      const preview = await call('/api/v1/jobs/import/preview', {
        method: 'POST',
        body: JSON.stringify({
          version: '1.0',
          collectedAt: timestamp,
          sourceCount: 1,
          snapshot: { mode: 'FULL', sources: ['snapshot-fixture'] },
          items,
        }),
      });
      expect(preview.response.status).toBe(200);
      const approval = importApproval(preview.body, items.length);
      return call('/api/v1/jobs/import/commit', {
        method: 'POST',
        body: JSON.stringify(approval),
      });
    };

    await commit(firstTimestamp, [
      item('https://example.test/jobs/snapshot-kept', '계속 게시되는 공고', firstTimestamp),
      item('https://example.test/jobs/snapshot-removed', '사라질 공고', firstTimestamp),
    ]);
    await commit(secondTimestamp, [
      item('https://example.test/jobs/snapshot-kept', '기존 제목 수정 시도', secondTimestamp),
    ]);
    const snapshotCount = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM job_source_snapshots WHERE source_name = 'snapshot-fixture'",
      )
      .first<{ count: number }>();
    expect(snapshotCount?.count).toBe(0);
    const disappeared = await db
      .prepare(
        "SELECT status FROM jobs WHERE source_url = 'https://example.test/jobs/snapshot-removed'",
      )
      .first<{ status: string }>();
    expect(disappeared?.status).toBe('ACTIVE');
    const kept = await db
      .prepare(
        "SELECT title FROM jobs WHERE source_url = 'https://example.test/jobs/snapshot-kept'",
      )
      .first<{ title: string }>();
    expect(kept?.title).toBe('계속 게시되는 공고');
  });

  it('rejects all legacy comment write routes', async () => {
    const results = [
      await call('/api/v1/coding/comments/comment-id', {
        method: 'PATCH',
        body: JSON.stringify({ markdown: '수정' }),
      }),
      await call('/api/v1/coding/comments/comment-id', { method: 'DELETE' }),
      await call('/api/v1/coding/comments/comment-id/report', {
        method: 'POST',
        body: JSON.stringify({ reason: '신고' }),
      }),
    ];
    expect(results.every((result) => result.response.status === 404)).toBe(true);
  });
});
