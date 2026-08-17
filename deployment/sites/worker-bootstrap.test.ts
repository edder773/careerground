import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleD1Api } from './d1-api.js';
import { LocalD1 } from './local-d1.js';
import worker from './worker.js';

const headers = {
  'oai-authenticated-user-id': 'phase-two-user',
  'oai-authenticated-user-email': 'phase-two@example.test',
  'oai-authenticated-user-full-name': 'Phase%20Two',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
};

describe('Sites worker bootstrap fast path', () => {
  let db: LocalD1;

  beforeEach(async () => {
    db = new LocalD1();
    const env = { DB: db, OPENAI_ADMIN_EMAILS: '', MAX_ACTIVE_USERS: '100' };
    await handleD1Api(
      new Request('https://careerground.example/api/v1/auth/onboarding', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: 'Phase Two', preferredLanguage: 'javascript' }),
      }),
      env,
    );
    await handleD1Api(
      new Request('https://careerground.example/api/v1/coding/daily-challenges', { headers }),
      env,
    );
  });

  afterEach(() => db.close());

  it('verifies the schema ledger inside the first workspace batch without a preflight round trip', async () => {
    db.resetQueryCount();
    db.resetPreparedSql();

    const response = await worker.fetch(
      new Request('https://careerground.example/api/v1/bootstrap?home=1', { headers }),
      {
        DB: db,
        OPENAI_ADMIN_EMAILS: '',
        MAX_ACTIVE_USERS: '100',
        ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
      },
      { waitUntil: () => undefined, passThroughOnException: () => undefined },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      user: { displayName: 'Phase Two' },
      home: { collections: [], dailyChallenges: expect.any(Array) },
    });
    expect(db.getQueryCount()).toBe(5);
    expect(
      db.preparedSql.some((sql) => /sqlite_schema|pragma_table_info|pragma_index_list/i.test(sql)),
    ).toBe(false);
    expect(db.preparedSql[0]).toContain('app_schema_migrations');
  });

  it('repairs a missing schema ledger through the latest migration only after the fast path detects it', async () => {
    await db.prepare('DROP TABLE app_schema_migrations').run();

    const response = await worker.fetch(
      new Request('https://careerground.example/api/v1/bootstrap?home=1', { headers }),
      {
        DB: db,
        OPENAI_ADMIN_EMAILS: '',
        MAX_ACTIVE_USERS: '100',
        ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
      },
      { waitUntil: () => undefined, passThroughOnException: () => undefined },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ user: { displayName: 'Phase Two' } });
    const ledger = await db
      .prepare('SELECT checksum FROM app_schema_migrations WHERE version = ?')
      .bind('0021_separate_job_schedule_dates')
      .first<{ checksum: string }>();
    expect(ledger?.checksum).toBe(
      'sha256:4e31cdb8719763ac88c1fb0311e50720237367cd0b88be0c9dfee26a962adb78',
    );
  });
});
