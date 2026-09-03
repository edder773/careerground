import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleD1Api } from './d1-api.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

describe('Sites D1 active API', () => {
  let db: LocalD1;

  beforeEach(async () => {
    db = new LocalD1();
    await ensureRuntimeSchema(db);
  });

  afterEach(() => db.close());

  async function call(path: string, init: RequestInit = {}, env: Record<string, string> = {}) {
    const headers = new Headers(init.headers);
    if (init.body) headers.set('content-type', 'application/json');
    const response = await handleD1Api(
      new Request(`https://careerground.example${path}`, { ...init, headers }),
      { DB: db, REQUEST_LOGGING: 'false', ...env },
    );
    return { response, body: (await response.json()) as Record<string, unknown> };
  }

  it('serves health and the anonymous public catalogs', async () => {
    const health = await call('/api/v1/health/ready');
    expect(health.response.status).toBe(200);
    expect(health.body).toMatchObject({
      status: 'ok',
      database: 'd1',
      schema: { ready: true },
      canary: { jobs: expect.any(Number), problems: expect.any(Number) },
    });
    expect(health.response.headers.get('x-request-id')).toBeTruthy();
    expect(health.response.headers.get('server-timing')).toMatch(/^app;dur=\d+\.\d$/);

    const jobs = await call('/api/v1/jobs/bootstrap?catalog=true');
    expect(jobs.response.status).toBe(200);
    expect(jobs.body).toMatchObject({ categories: expect.any(Array), data: expect.any(Array) });

    const problems = await call('/api/v1/coding/problems?track=ALGORITHM');
    expect(problems.response.status).toBe(200);
    expect(Array.isArray(problems.body)).toBe(true);

    const challenges = await call('/api/v1/coding/daily-challenges');
    expect(challenges.response.status).toBe(200);
    expect(Array.isArray(challenges.body)).toBe(true);
    expect(challenges.body).toHaveLength(3);
  });

  it('supports active job filters, cursor pagination and detail reads', async () => {
    const page = await call('/api/v1/jobs?page=cursor&limit=2&sort=company');
    expect(page.response.status).toBe(200);
    expect(page.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
    });
    const items = page.body.items as Array<{ id: string; company: { name: string } }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(2);

    const company = items[0]!.company.name.slice(0, 2);
    const filtered = await call(`/api/v1/jobs?q=${encodeURIComponent(company)}`);
    expect(filtered.response.status).toBe(200);
    const filteredJobs = filtered.body as unknown as Array<{
      company: { name: string };
      title: string;
      source: { name: string };
    }>;
    expect(filteredJobs.length).toBeGreaterThan(0);
    expect(
      filteredJobs.every((job) =>
        [job.company.name, job.title, job.source.name].some((value) =>
          value.toLocaleLowerCase().includes(company.toLocaleLowerCase()),
        ),
      ),
    ).toBe(true);

    const detail = await call(`/api/v1/jobs/${items[0]!.id}`);
    expect(detail.response.status).toBe(200);
    expect(detail.body).toMatchObject({ id: items[0]!.id, bookmarked: false, savedBy: [] });
  });

  it('validates coding filters and returns public problem details without personal progress', async () => {
    const invalid = await call('/api/v1/coding/problems?track=HTML');
    expect(invalid.response.status).toBe(400);
    expect(invalid.body).toMatchObject({ code: 'INVALID_TRACK' });

    const list = await call('/api/v1/coding/problems?track=SQL&level=3');
    expect(list.response.status).toBe(200);
    const problems = list.body as unknown as Array<Record<string, unknown>>;
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((problem) => problem.track === 'SQL' && problem.level === 3)).toBe(true);
    expect(problems.every((problem) => !Object.hasOwn(problem, 'progress'))).toBe(true);

    const detail = await call(`/api/v1/coding/problems/${problems[0]!.id}`);
    expect(detail.response.status).toBe(200);
    expect(detail.body).not.toHaveProperty('progress');
  });

  it('returns only generic NOT_FOUND responses for every removed legacy API family', async () => {
    const activeCountsBefore = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM jobs) AS jobs,
           (SELECT COUNT(*) FROM coding_problems) AS codingProblems`,
      )
      .first<Record<string, number>>();
    const removedRoutes: Array<[string, RequestInit?]> = [
      ['/api/v1/auth/config'],
      ['/api/v1/auth/me'],
      ['/api/v1/auth/logout', { method: 'POST', body: '{}' }],
      ['/api/v1/bootstrap'],
      ['/api/v1/dashboard'],
      ['/api/v1/search?q=test'],
      ['/api/v1/collections'],
      ['/api/v1/collections/example/items', { method: 'POST', body: '{}' }],
      ['/api/v1/coding/solutions'],
      ['/api/v1/coding/rankings'],
      ['/api/v1/coding/problems/example/favorite', { method: 'PATCH', body: '{}' }],
      ['/api/v1/notifications'],
      ['/api/v1/learning'],
      ['/api/v1/learning/bootstrap'],
      ['/api/v1/learning/units/example'],
      ['/api/v1/learning/questions/example/answer', { method: 'POST', body: '{}' }],
      ['/api/v1/jobs/saved', { method: 'POST', body: '{}' }],
      ['/api/v1/jobs/import/preview', { method: 'POST', body: '{}' }],
      ['/api/v1/admin/overview'],
    ];

    for (const [path, init] of removedRoutes) {
      const result = await call(path, init);
      expect(result.response.status, path).toBe(404);
      expect(result.body, path).toMatchObject({ code: 'NOT_FOUND' });
      expect(JSON.stringify(result.body), path).not.toContain('ROUTE_RETIRED');
    }

    const activeCountsAfter = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM jobs) AS jobs,
           (SELECT COUNT(*) FROM coding_problems) AS codingProblems`,
      )
      .first<Record<string, number>>();
    expect(activeCountsAfter).toEqual(activeCountsBefore);

    const retiredTables = await db
      .prepare(
        `SELECT name FROM sqlite_schema
          WHERE type = 'table'
            AND (name IN ('users', 'collections', 'solutions', 'learning_units', 'notifications')
                 OR name LIKE 'workspace_search%')`,
      )
      .all<Record<string, string>>();
    expect(retiredTables.results).toEqual([]);
  });

  it('keeps Slack and job publication routes private', async () => {
    const digest = await call('/api/v1/internal/slack-digest');
    expect(digest.response.status).toBe(503);
    expect(digest.body).toMatchObject({ code: 'DIGEST_AUTH_NOT_CONFIGURED' });

    const wrongDigestToken = await call(
      '/api/v1/internal/slack-digest',
      { headers: { authorization: 'Bearer wrong' } },
      { DIGEST_API_TOKEN: 'secret' },
    );
    expect(wrongDigestToken.response.status).toBe(401);

    const publish = await call('/api/v1/internal/jobs-v5/publish', {
      method: 'POST',
      body: '{}',
    });
    expect(publish.response.status).toBe(503);
    expect(publish.body).toMatchObject({ code: 'PUBLISH_AUTH_NOT_CONFIGURED' });
  });
});
