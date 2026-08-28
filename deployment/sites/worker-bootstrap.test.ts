import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalD1 } from './local-d1.js';
import { EXPECTED_SCHEMA_VERSION } from './migration-authority.js';
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
    expect(db.getQueryCount()).toBe(4);
    expect(db.getBatchCount()).toBe(1);
    expect(db.preparedSql[0]).toContain('JOIN auth_sessions');
    expect(
      db.preparedSql.some((sql) => /sqlite_schema|pragma_table_info|pragma_index_list/i.test(sql)),
    ).toBe(false);
  });

  it('does not repeat the schema inventory inside the readiness route', async () => {
    db.resetQueryCount();
    db.resetPreparedSql();

    const response = await worker.fetch(
      new Request('https://careerground.example/api/v1/health/ready'),
      env(),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'ok',
      database: 'd1',
      schema: { ready: true, expectedVersion: EXPECTED_SCHEMA_VERSION },
    });
    expect(db.getQueryCount()).toBe(1);
    expect(db.preparedSql).toHaveLength(1);
    expect(db.preparedSql[0]).toContain('SELECT COUNT(*) FROM jobs');
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

describe('Sites worker schema readiness gate', () => {
  it('returns 503 for an invalid migration ledger without changing user data', async () => {
    const db = new LocalD1();
    try {
      await db
        .prepare(
          `INSERT INTO users
             (id, site_user_id, email, display_name, role, preferred_language, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'MEMBER', 'javascript', ?, ?)`,
        )
        .bind(
          'worker-schema-sentinel',
          'worker-schema-sentinel',
          'worker-schema-sentinel@example.test',
          'Schema Sentinel',
          '2026-08-25',
          '2026-08-25',
        )
        .run();
      await db
        .prepare('DELETE FROM app_schema_migrations WHERE version = ?')
        .bind(EXPECTED_SCHEMA_VERSION)
        .run();
      db.resetPreparedSql();

      const response = await worker.fetch(
        new Request('https://careerground.example/api/v1/jobs'),
        {
          DB: db,
          ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
        },
        context,
      );

      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ code: 'DB_SCHEMA_NOT_READY' });
      const sentinel = await db
        .prepare(
          "SELECT display_name AS displayName FROM users WHERE id = 'worker-schema-sentinel'",
        )
        .first<{ displayName: string }>();
      expect(sentinel).toEqual({ displayName: 'Schema Sentinel' });
      expect(
        db.preparedSql.some((sql) =>
          /DELETE FROM (users|saved_jobs|collections|learning_progress|notifications|auth_sessions)/i.test(
            sql,
          ),
        ),
      ).toBe(false);
    } finally {
      db.close();
    }
  });

  it('returns 503 when the expected migration checksum does not match', async () => {
    const db = new LocalD1();
    try {
      await db
        .prepare("UPDATE app_schema_migrations SET checksum = 'sha256:invalid' WHERE version = ?")
        .bind(EXPECTED_SCHEMA_VERSION)
        .run();

      const response = await worker.fetch(
        new Request('https://careerground.example/api/v1/health/ready'),
        {
          DB: db,
          ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
        },
        context,
      );

      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ code: 'DB_SCHEMA_NOT_READY' });
    } finally {
      db.close();
    }
  });
});
