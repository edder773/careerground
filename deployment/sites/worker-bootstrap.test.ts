import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalD1 } from './local-d1.js';
import worker from './worker.js';

const context = { waitUntil: () => undefined, passThroughOnException: () => undefined };

describe('Sites worker Google session bootstrap', () => {
  let db: LocalD1;
  let sessionCookie: string;

  const env = () => ({
    DB: db,
    ADMIN_EMAILS: '',
    AUTH_TEST_MODE: 'true',
    MAX_ACTIVE_USERS: '100',
    REQUEST_LOGGING: 'false',
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
  });

  beforeEach(async () => {
    db = new LocalD1();
    const login = await worker.fetch(
      new Request('https://careerground.example/api/v1/auth/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject: 'phase-two-user',
          email: 'phase-two@example.test',
          displayName: 'Phase Two',
        }),
      }),
      env(),
      context,
    );
    expect(login.status).toBe(200);
    sessionCookie = login.headers.get('set-cookie')?.split(';')[0] || '';
    expect(sessionCookie).toContain('careerground_session=');

    await worker.fetch(
      new Request('https://careerground.example/api/v1/auth/onboarding', {
        method: 'POST',
        headers: { cookie: sessionCookie, 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: 'Phase Two', preferredLanguage: 'javascript' }),
      }),
      env(),
      context,
    );
    await worker.fetch(
      new Request('https://careerground.example/api/v1/coding/daily-challenges', {
        headers: { cookie: sessionCookie },
      }),
      env(),
      context,
    );
  });

  afterEach(() => db.close());

  it('reuses the prepared schema state and loads the workspace with an opaque session', async () => {
    db.resetQueryCount();
    db.resetBatchCount();
    db.resetPreparedSql();

    const response = await worker.fetch(
      new Request('https://careerground.example/api/v1/bootstrap?home=1', {
        headers: { cookie: sessionCookie },
      }),
      env(),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      user: { displayName: 'Phase Two' },
      home: { collections: [], dailyChallenges: expect.any(Array) },
    });
    expect(db.getQueryCount()).toBe(5);
    expect(db.getBatchCount()).toBe(1);
    expect(db.preparedSql[0]).toContain('JOIN auth_sessions');
    expect(
      db.preparedSql.some((sql) => /sqlite_schema|pragma_table_info|pragma_index_list/i.test(sql)),
    ).toBe(false);
  });

  it('does not accept anonymous or legacy OpenAI identity headers', async () => {
    const anonymous = await worker.fetch(
      new Request('https://careerground.example/api/v1/jobs'),
      env(),
      context,
    );
    expect(anonymous.status).toBe(401);

    const legacy = await worker.fetch(
      new Request('https://careerground.example/api/v1/auth/me', {
        headers: {
          'oai-authenticated-user-id': 'legacy-user',
          'oai-authenticated-user-email': 'legacy@example.test',
        },
      }),
      env(),
      context,
    );
    expect(legacy.status).toBe(401);
  });
});
