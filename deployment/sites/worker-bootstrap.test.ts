import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalD1 } from './local-d1.js';
import { EXPECTED_SCHEMA_VERSION } from './migration-authority.js';
import worker from './worker.js';

const context = { waitUntil: () => undefined, passThroughOnException: () => undefined };

describe('Sites worker SPA fallback', () => {
  it.each(['/jobs', '/coding', '/learning'])(
    'serves the app shell for %s deep links',
    async (path) => {
      const requestedPaths: string[] = [];
      const response = await worker.fetch(
        new Request(`https://careerground.example${path}`, {
          headers: { accept: 'text/html,application/xhtml+xml' },
        }),
        {
          ASSETS: {
            fetch: async (request: Request) => {
              const pathname = new URL(request.url).pathname;
              requestedPaths.push(pathname);
              return pathname === '/'
                ? new Response('<div id="root"></div>', {
                    status: 200,
                    headers: { 'content-type': 'text/html' },
                  })
                : new Response(null, { status: 404 });
            },
          },
        },
        context,
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<div id="root"></div>');
      expect(requestedPaths).toEqual([path, '/']);
    },
  );

  it('does not return the app shell for a missing non-HTML asset', async () => {
    const response = await worker.fetch(
      new Request('https://careerground.example/missing.js', {
        headers: { accept: 'application/javascript' },
      }),
      { ASSETS: { fetch: async () => new Response(null, { status: 404 }) } },
      context,
    );

    expect(response.status).toBe(404);
  });
});

describe('Sites worker public catalog bootstrap', () => {
  let db: LocalD1;

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
    const ready = await worker.fetch(
      new Request('https://careerground.example/api/v1/health/ready'),
      env(),
      context,
    );
    expect(ready.status).toBe(200);
  });

  afterEach(() => db.close());

  it('loads the public jobs catalog without creating a session', async () => {
    db.resetQueryCount();
    db.resetBatchCount();
    db.resetPreparedSql();

    const response = await worker.fetch(
      new Request('https://careerground.example/api/v1/jobs/bootstrap?catalog=true'),
      env(),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      categories: expect.any(Array),
      data: expect.any(Array),
    });
    expect(db.getQueryCount()).toBeGreaterThan(0);
    expect(db.getBatchCount()).toBe(1);
    expect(db.preparedSql.join('\n')).not.toContain('JOIN auth_sessions');
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

  it('serves common data anonymously and does not accept legacy identity headers', async () => {
    const anonymous = await worker.fetch(
      new Request('https://careerground.example/api/v1/jobs'),
      env(),
      context,
    );
    expect(anonymous.status).toBe(200);

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
