import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleD1Api, runScheduledMaintenance } from './d1-api.js';
import { LocalD1 } from './local-d1.js';

const adminHeaders = {
  'oai-authenticated-user-id': 'site-admin',
  'oai-authenticated-user-email': 'admin@example.test',
  'oai-authenticated-user-full-name': 'Admin%20User',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
};

const memberHeaders = {
  'oai-authenticated-user-id': 'site-member',
  'oai-authenticated-user-email': 'member@example.test',
  'oai-authenticated-user-full-name': 'Member%20User',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
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

  beforeEach(() => {
    db = new LocalD1();
  });

  afterEach(() => db.close());

  async function call(
    path: string,
    init: RequestInit = {},
    headers: Record<string, string> = adminHeaders,
    env: Record<string, string> = {},
  ) {
    const requestHeaders = new Headers(headers);
    if (init.body && !(init.body instanceof FormData))
      requestHeaders.set('content-type', 'application/json');
    const response = await handleD1Api(
      new Request(`https://careerground.example${path}`, { ...init, headers: requestHeaders }),
      {
        DB: db,
        OPENAI_ADMIN_EMAILS: 'admin@example.test',
        MAX_ACTIVE_USERS: '100',
        REQUEST_LOGGING: 'false',
        ...env,
      },
    );
    return { response, body: (await response.json()) as Record<string, unknown> };
  }

  it('provisions normal first users as MEMBER and only allowlisted users as ADMIN', async () => {
    const health = await call('/api/v1/health', {}, {});
    expect(health.response.status).toBe(200);
    expect(health.body).toMatchObject({ status: 'ok', database: 'd1' });
    expect(health.response.headers.get('x-request-id')).toBeTruthy();
    expect(health.response.headers.get('server-timing')).toMatch(/^app;dur=\d+\.\d$/);
    expect(Number(health.response.headers.get('x-response-time-ms'))).toBeGreaterThanOrEqual(0);

    const member = await call('/api/v1/auth/me', {}, memberHeaders);
    expect(member.body).toMatchObject({ user: { role: 'MEMBER', onboardingCompleted: false } });

    const me = await call('/api/v1/auth/me');
    expect(me.response.status).toBe(200);
    expect(me.body).toMatchObject({
      user: {
        email: 'admin@example.test',
        displayName: 'Admin User',
        role: 'ADMIN',
        preferredLanguage: 'javascript',
        onboardingCompleted: false,
      },
    });

    const onboarding = await call(
      '/api/v1/auth/onboarding',
      {
        method: 'POST',
        body: JSON.stringify({ displayName: '새 멤버', preferredLanguage: 'java' }),
      },
      memberHeaders,
    );
    expect(onboarding.response.status).toBe(200);
    const refreshed = await call('/api/v1/auth/me', {}, memberHeaders);
    expect(refreshed.body).toMatchObject({
      user: {
        displayName: '새 멤버',
        preferredLanguage: 'java',
        onboardingCompleted: true,
      },
    });

    const unauthenticated = await call('/api/v1/auth/me', {}, {});
    expect(unauthenticated.response.status).toBe(401);
    expect(unauthenticated.body).toMatchObject({ code: 'UNAUTHORIZED' });
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

  it('does not rewrite or reread an unchanged signed-in user', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);
    const before = await db
      .prepare('SELECT updated_at AS updatedAt FROM users WHERE site_user_id = ?')
      .bind(memberHeaders['oai-authenticated-user-id'])
      .first<{ updatedAt: string }>();

    db.resetQueryCount();
    db.resetBatchCount();
    db.resetPreparedSql();
    const repeated = await call('/api/v1/auth/me', {}, memberHeaders);

    expect(repeated.response.status).toBe(200);
    expect(db.getQueryCount()).toBe(2);
    expect(db.getBatchCount()).toBe(1);
    expect(db.preparedSql.filter((sql) => sql.includes('site_user_id AS siteUserId'))).toHaveLength(
      1,
    );
    expect(db.preparedSql.some((sql) => /^\s*UPDATE users/i.test(sql))).toBe(false);
    const after = await db
      .prepare('SELECT updated_at AS updatedAt FROM users WHERE site_user_id = ?')
      .bind(memberHeaders['oai-authenticated-user-id'])
      .first<{ updatedAt: string }>();
    expect(after?.updatedAt).toBe(before?.updatedAt);
  });

  it('persists and audits a role change without rereading the user', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders, { OPENAI_ADMIN_EMAILS: '' });
    db.resetQueryCount();
    db.resetBatchCount();
    db.resetPreparedSql();

    const promoted = await call('/api/v1/auth/me', {}, memberHeaders, {
      OPENAI_ADMIN_EMAILS: 'member@example.test',
    });

    expect(promoted.body).toMatchObject({ user: { role: 'ADMIN' } });
    expect(db.getQueryCount()).toBe(4);
    expect(db.getBatchCount()).toBe(2);
    expect(db.preparedSql.filter((sql) => sql.includes('site_user_id AS siteUserId'))).toHaveLength(
      1,
    );
    const stored = await db
      .prepare('SELECT role FROM users WHERE site_user_id = ?')
      .bind(memberHeaders['oai-authenticated-user-id'])
      .first<{ role: string }>();
    const roleAudit = await db
      .prepare("SELECT action FROM audit_logs WHERE action = 'USER_ROLE_SYNCED'")
      .first<{ action: string }>();
    expect(stored?.role).toBe('ADMIN');
    expect(roleAudit?.action).toBe('USER_ROLE_SYNCED');
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
      unreadCount: 1,
      home: {
        collections: [],
        dashboard: { recentJobs: expect.any(Number), expiringJobs: expect.any(Number) },
        dailyChallenges: [
          expect.objectContaining({ levelSlot: 1 }),
          expect.objectContaining({ levelSlot: 2 }),
          expect.objectContaining({ levelSlot: 34 }),
        ],
      },
    });
    expect(db.getQueryCount()).toBe(5);
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

    expect(jobCount?.count).toBe(34);
    expect(currentJobCount?.count).toBe(34);
    expect(expiredJobCount?.count).toBe(0);
    expect(problemCount?.count).toBe(427);
    expect(sqlProblemCount?.count).toBe(62);
    expect(dummyCount?.count).toBe(0);

    const jobs = await call('/api/v1/jobs?sort=new');
    expect(jobs.response.status).toBe(200);
    expect(jobs.body).toHaveLength(16);
    expect(jobs.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'AI Engineer',
          company: expect.objectContaining({ name: '라피치' }),
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

    db.resetQueryCount();
    db.resetBatchCount();
    const catalog = await call('/api/v1/jobs?sort=new&page=cursor&limit=40', {}, memberHeaders);
    expect(catalog.response.status).toBe(200);
    expect(catalog.body).toMatchObject({ items: expect.any(Array), total: 16 });
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
      unreadCount: expect.any(Number),
      categories: expect.arrayContaining(['AI_ML']),
      data: { items: expect.any(Array), total: 16 },
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
    expect(fullCatalog.body.data as unknown[]).toHaveLength(16);
    expect(db.getQueryCount()).toBe(3);
    expect(db.getBatchCount()).toBe(1);
  });

  it('returns the welcome unread count when job bootstrap provisions a new user', async () => {
    const newcomer = {
      ...memberHeaders,
      'oai-authenticated-user-id': 'job-bootstrap-newcomer',
      'oai-authenticated-user-email': 'job-bootstrap-newcomer@example.test',
    };
    const bootstrap = await call(
      '/api/v1/jobs/bootstrap?sort=new&page=cursor&limit=40',
      {},
      newcomer,
    );
    expect(bootstrap.response.status).toBe(200);
    expect(bootstrap.body).toMatchObject({ unreadCount: 1, data: { total: 16 } });
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

  it('returns stable cursor pages and totals for large shared catalogs', async () => {
    const firstProblems = await call(
      '/api/v1/coding/problems?track=ALGORITHM&page=cursor&limit=25',
    );
    const problemPage = firstProblems.body as unknown as {
      items: Array<{ id: string }>;
      nextCursor: string;
      total: number;
    };
    expect(problemPage.items).toHaveLength(25);
    expect(problemPage.total).toBe(365);
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
    expect(jobPage.total).toBe(16);
    expect(jobPage.nextCursor).toBeTruthy();
    const nextJobs = await call(
      `/api/v1/jobs?sort=new&page=cursor&limit=10&cursor=${encodeURIComponent(jobPage.nextCursor)}`,
    );
    expect((nextJobs.body as unknown as { items: unknown[] }).items).toHaveLength(6);
    expect(
      (nextJobs.body as unknown as { items: Array<{ id: string }> }).items.map((item) => item.id),
    ).not.toContain(jobPage.items.at(-1)?.id);
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
    expect(db.getBatchCount()).toBe(1);
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
    expect(september.body).toHaveLength(0);

    const invalid = await call(
      '/api/v1/jobs?deadlineFrom=2026-09-30T15%3A00%3A00.000Z&deadlineTo=2026-08-31T15%3A00%3A00.000Z',
    );
    expect(invalid.response.status).toBe(400);
  });

  it('returns start, deadline, and rolling schedule data for calendar rendering', async () => {
    const calendar = await call(
      '/api/v1/jobs?calendar=true&sort=deadline&deadlineFrom=2026-07-31T15%3A00%3A00.000Z&deadlineTo=2026-08-31T15%3A00%3A00.000Z',
    );
    const rows = calendar.body as unknown as Array<{
      collectedAt: string;
      deadlineAt: string | null;
      rolling: boolean;
    }>;
    expect(calendar.response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.rolling)).toBe(true);
    expect(rows.some((row) => Boolean(row.collectedAt))).toBe(true);
    expect(rows.some((row) => Boolean(row.deadlineAt))).toBe(true);
  });

  it('persists coding progress, solution, reaction, and comment', async () => {
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
    expect(sqlRows).toHaveLength(62);
    expect(sqlRows.every((problem) => problem.track === 'SQL')).toBe(true);
    const challenge = await call('/api/v1/coding/daily-challenge');
    const daily = challenge.body as unknown as { id: string; problem: { id: string } };
    expect(daily.problem.id).toBeTruthy();

    const solution = await call('/api/v1/coding/solutions', {
      method: 'POST',
      body: JSON.stringify({
        problemId: daily.problem.id,
        title: '테스트 풀이',
        language: 'javascript',
        code: 'return true;',
        description: 'D1에 저장되는 풀이',
        solved: true,
        visibility: 'PRIVATE',
      }),
    });
    const saved = solution.body as { id: string };
    await call(`/api/v1/coding/solutions/${saved.id}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ active: true }),
    });
    await call(`/api/v1/coding/solutions/${saved.id}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ active: true }),
    });
    await call(`/api/v1/coding/solutions/${saved.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ markdown: '좋은 풀이입니다.' }),
    });
    await call(`/api/v1/coding/daily-challenge/${daily.id}/complete`, { method: 'POST' });

    const solutions = await call(
      `/api/v1/coding/solutions?problemId=${daily.problem.id}`,
      {},
      memberHeaders,
    );
    expect(solutions.body).toEqual([
      expect.objectContaining({
        id: saved.id,
        language: 'javascript',
        visibility: 'MEMBERS',
        reactionCount: 1,
        reactedByMe: false,
        commentCount: 1,
      }),
    ]);
    const detail = await call(`/api/v1/coding/solutions/${saved.id}`, {}, memberHeaders);
    expect(detail.body).toMatchObject({
      id: saved.id,
      reactions: [expect.any(Object)],
      comments: [expect.objectContaining({ markdown: '좋은 풀이입니다.' })],
    });
    const pagedSolutions = await call(
      `/api/v1/coding/solutions?problemId=${daily.problem.id}&page=cursor&limit=1`,
      {},
      memberHeaders,
    );
    expect(pagedSolutions.body).toMatchObject({
      items: [expect.objectContaining({ id: saved.id })],
      nextCursor: null,
      total: 1,
    });
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
    const source = (learning.body as unknown as Array<{ units: Array<{ id: string }> }>)[0];
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

  it('keeps unread GET pure and creates deadline notifications in scheduled maintenance', async () => {
    await call('/api/v1/auth/me');
    const job = await db.prepare("SELECT id FROM jobs WHERE status = 'ACTIVE' LIMIT 1").first<{
      id: string;
    }>();
    const deadline = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await db
      .prepare('UPDATE jobs SET deadline_at = ?, rolling = 0 WHERE id = ?')
      .bind(deadline, job!.id)
      .run();
    await call('/api/v1/jobs/saved', {
      method: 'POST',
      body: JSON.stringify({ jobId: job!.id, bookmarked: true }),
    });

    await call('/api/v1/notifications/unread-count');
    await call('/api/v1/notifications/unread-count');

    const beforeMaintenance = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM notifications WHERE type = 'JOB_DEADLINE' AND user_id = (SELECT id FROM users WHERE site_user_id = 'site-admin')",
      )
      .first<{ count: number }>();
    expect(beforeMaintenance?.count).toBe(0);

    const maintenance = await runScheduledMaintenance({ DB: db });
    expect(maintenance).toMatchObject({ acquired: true, notifications: 1 });
    const afterMaintenance = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM notifications WHERE type = 'JOB_DEADLINE' AND user_id = (SELECT id FROM users WHERE site_user_id = 'site-admin')",
      )
      .first<{ count: number }>();
    expect(afterMaintenance?.count).toBe(1);
  });

  it('runs scheduled expiry without creating review notifications under a single lease', async () => {
    await call('/api/v1/auth/me');
    const user = await db
      .prepare("SELECT id FROM users WHERE site_user_id = 'site-admin'")
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
    await db
      .prepare(
        "UPDATE jobs SET deadline_at = ?, rolling = 0, status = 'ACTIVE' WHERE id = (SELECT id FROM jobs LIMIT 1)",
      )
      .bind(new Date(Date.now() - 86_400_000).toISOString())
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
    expect(result.expiredJobs).toBeGreaterThan(0);
    expect(result.notifications).toBe(0);
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
        "INSERT INTO scheduler_leases (name, owner_id, lease_until, updated_at) VALUES ('notifications-and-expiry', 'other-worker', ?, ?)",
      )
      .bind(new Date(Date.now() + 60_000).toISOString(), timestamp)
      .run();
    expect(await runScheduledMaintenance({ DB: db })).toEqual({
      acquired: false,
      expiredJobs: 0,
      notifications: 0,
    });
  });

  it('filters notifications and traverses a stable cursor', async () => {
    await call('/api/v1/auth/me');
    const user = await db
      .prepare("SELECT id FROM users WHERE site_user_id = 'site-admin'")
      .first<{ id: string }>();
    for (let index = 0; index < 3; index += 1) {
      await db
        .prepare(
          `INSERT INTO notifications
             (id, user_id, type, title, message, created_at)
           VALUES (?, ?, ?, ?, '', ?)`,
        )
        .bind(
          `cursor-notification-${index}`,
          user!.id,
          index === 2 ? 'COMMENT' : 'SYSTEM',
          `알림 ${index}`,
          new Date(Date.now() - index * 1_000).toISOString(),
        )
        .run();
    }
    const firstPage = await call('/api/v1/notifications?type=SYSTEM&page=cursor&limit=1');
    expect(firstPage.body).toMatchObject({
      items: [expect.objectContaining({ type: 'SYSTEM' })],
      nextCursor: expect.any(String),
    });
    const cursor = String(firstPage.body.nextCursor);
    const secondPage = await call(
      `/api/v1/notifications?type=SYSTEM&page=cursor&limit=1&cursor=${encodeURIComponent(cursor)}`,
    );
    expect(secondPage.body).toMatchObject({
      items: [expect.objectContaining({ type: 'SYSTEM' })],
    });
    expect((secondPage.body.items as Array<{ id: string }>)[0].id).not.toBe(
      (firstPage.body.items as Array<{ id: string }>)[0].id,
    );
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
      ]),
    );
    expect(memberLearning.body).toEqual(adminLearning.body);
    const units = (
      adminLearning.body as unknown as Array<{
        units: Array<{ id: string }>;
      }>
    ).flatMap((source) => source.units);
    expect(units).toHaveLength(23);
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

  it('automatically ranks members and does not expose export or deletion request routes', async () => {
    await call('/api/v1/auth/me');
    await call('/api/v1/auth/me', {}, memberHeaders);
    await db
      .prepare("UPDATE users SET ranking_opt_in = 0 WHERE email = 'member@example.test'")
      .run();

    const ranking = await call('/api/v1/coding/rankings');
    expect(ranking.body).toMatchObject({
      selfReported: true,
      rows: expect.arrayContaining([expect.objectContaining({ displayName: 'Member User' })]),
    });

    const exportResponse = await call('/api/v1/auth/export');
    const deletionResponse = await call('/api/v1/auth/delete-request', { method: 'POST' });
    expect(exportResponse.response.status).toBe(404);
    expect(deletionResponse.response.status).toBe(404);
  });

  it('preserves problem memo and favorite across independent status patches', async () => {
    const problem = await db
      .prepare('SELECT id FROM coding_problems WHERE active = 1 ORDER BY position LIMIT 1')
      .first<{ id: string }>();
    expect(problem?.id).toBeTruthy();
    const base = `/api/v1/coding/problems/${problem!.id}`;
    await call(`${base}/memo`, {
      method: 'PATCH',
      body: JSON.stringify({ memo: 'List<String> a < b && c > d' }),
    });
    await call(`${base}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ favorite: true }),
    });
    await call(`${base}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    await call(`${base}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SOLVED' }),
    });
    const progress = await db
      .prepare('SELECT status, favorite, memo FROM problem_progress WHERE problem_id = ?')
      .bind(problem!.id)
      .first<{ status: string; favorite: number; memo: string }>();
    expect(progress).toEqual({
      status: 'SOLVED',
      favorite: 1,
      memo: 'List<String> a < b && c > d',
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

  it('reconciles a declared full source snapshot and marks disappeared jobs removed', async () => {
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
      item('https://example.test/jobs/snapshot-kept', '계속 게시되는 공고', secondTimestamp),
    ]);
    const latestSnapshot = await db
      .prepare(
        "SELECT expired_count AS expiredCount FROM job_source_snapshots WHERE source_name = 'snapshot-fixture' ORDER BY collected_at DESC LIMIT 1",
      )
      .first<{ expiredCount: number }>();
    expect(latestSnapshot?.expiredCount).toBe(1);
    const disappeared = await db
      .prepare(
        "SELECT status FROM jobs WHERE source_url = 'https://example.test/jobs/snapshot-removed'",
      )
      .first<{ status: string }>();
    expect(disappeared?.status).toBe('REMOVED');
  });

  it('redacts hidden replies in the API response', async () => {
    await call('/api/v1/auth/me', {}, memberHeaders);
    const problem = await db
      .prepare('SELECT id FROM coding_problems WHERE active = 1 ORDER BY position LIMIT 1')
      .first<{ id: string }>();
    const solution = await call('/api/v1/coding/solutions', {
      method: 'POST',
      body: JSON.stringify({
        problemId: problem!.id,
        title: 'redaction fixture',
        language: 'javascript',
        code: 'return true;',
        description: '설명',
        solved: true,
      }),
    });
    const solutionId = String(solution.body.id);
    const parent = await call(`/api/v1/coding/solutions/${solutionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ markdown: '부모 댓글' }),
    });
    const reply = await call(
      `/api/v1/coding/solutions/${solutionId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({
          markdown: '<script>private reply</script>',
          parentId: parent.body.id,
        }),
      },
      memberHeaders,
    );
    await db
      .prepare('UPDATE solution_comments SET hidden_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), reply.body.id)
      .run();
    const listed = await call(`/api/v1/coding/solutions/${solutionId}`, {}, memberHeaders);
    const comments = (listed.body as unknown as { comments: Array<{ replies: unknown[] }> })
      .comments;
    expect(comments?.[0]?.replies).toEqual([
      expect.objectContaining({ markdown: null, redacted: 'HIDDEN' }),
    ]);
    expect(JSON.stringify(listed.body)).not.toContain('private reply');
  });

  it('lets owners edit and soft-delete comments and records member reports', async () => {
    const problem = await db
      .prepare('SELECT id FROM coding_problems WHERE active = 1 ORDER BY position LIMIT 1')
      .first<{ id: string }>();
    const solution = await call('/api/v1/coding/solutions', {
      method: 'POST',
      body: JSON.stringify({
        problemId: problem!.id,
        title: 'comment actions fixture',
        language: 'javascript',
        code: 'return true;',
        description: '설명',
        solved: true,
      }),
    });
    const created = await call(`/api/v1/coding/solutions/${solution.body.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ markdown: '수정 전' }),
    });
    const edited = await call(`/api/v1/coding/comments/${created.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ markdown: '**수정 후**' }),
    });
    expect(edited.body).toMatchObject({ edited: true, markdown: '**수정 후**' });
    const reported = await call(
      `/api/v1/coding/comments/${created.body.id}/report`,
      { method: 'POST', body: JSON.stringify({ reason: '검토가 필요한 댓글' }) },
      memberHeaders,
    );
    expect(reported.body).toMatchObject({ reported: true });
    const removed = await call(`/api/v1/coding/comments/${created.body.id}`, {
      method: 'DELETE',
    });
    expect(removed.body).toMatchObject({ deleted: true });
    const detail = await call(`/api/v1/coding/solutions/${solution.body.id}`);
    expect(detail.body).toMatchObject({
      comments: [expect.objectContaining({ markdown: null, redacted: 'DELETED' })],
    });
    const report = await db
      .prepare("SELECT action FROM audit_logs WHERE action = 'COMMENT_REPORTED' AND target_id = ?")
      .bind(created.body.id)
      .first<{ action: string }>();
    expect(report?.action).toBe('COMMENT_REPORTED');
  });
});
