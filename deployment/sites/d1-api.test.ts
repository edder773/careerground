import { readFileSync } from 'node:fs';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { handleD1Api } from './d1-api.js';
import type { D1Database, D1PreparedStatement, D1Result } from './d1.js';

class SqliteStatement implements D1PreparedStatement {
  constructor(
    private readonly statement: StatementSync,
    private readonly values: unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new SqliteStatement(this.statement, values);
  }

  async first<T>() {
    return (this.statement.get(...this.values) as T | undefined) || null;
  }

  async all<T>(): Promise<D1Result<T>> {
    return { success: true, results: this.statement.all(...this.values) as T[] };
  }

  async run<T>(): Promise<D1Result<T>> {
    const result = this.statement.run(...this.values);
    return {
      success: true,
      results: [],
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

class SqliteD1 implements D1Database {
  private readonly sqlite = new DatabaseSync(':memory:');

  constructor() {
    for (const file of ['drizzle/0000_loose_shooting_star.sql', 'drizzle/0001_seed.sql']) {
      const migration = readFileSync(file, 'utf8');
      for (const statement of migration.split('--> statement-breakpoint')) {
        if (statement.trim()) this.sqlite.exec(statement);
      }
    }
  }

  prepare(sql: string) {
    return new SqliteStatement(this.sqlite.prepare(sql));
  }

  async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return Promise.all(statements.map((statement) => statement.run<T>()));
  }

  close() {
    this.sqlite.close();
  }
}

const adminHeaders = {
  'oai-authenticated-user-id': 'site-admin',
  'oai-authenticated-user-email': 'admin@example.test',
  'oai-authenticated-user-full-name': 'Admin%20User',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
};

describe('Sites D1 API', () => {
  let db: SqliteD1;

  beforeEach(() => {
    db = new SqliteD1();
  });

  async function call(
    path: string,
    init: RequestInit = {},
    headers: Record<string, string> = adminHeaders,
  ) {
    const requestHeaders = new Headers(headers);
    if (init.body && !(init.body instanceof FormData))
      requestHeaders.set('content-type', 'application/json');
    const response = await handleD1Api(
      new Request(`https://careerground.example${path}`, { ...init, headers: requestHeaders }),
      { DB: db },
    );
    return { response, body: (await response.json()) as Record<string, unknown> };
  }

  it('reports D1 readiness and provisions the first OpenAI user as admin', async () => {
    const health = await call('/api/v1/health', {}, {});
    expect(health.response.status).toBe(200);
    expect(health.body).toMatchObject({ status: 'ok', database: 'd1' });

    const me = await call('/api/v1/auth/me');
    expect(me.response.status).toBe(200);
    expect(me.body).toMatchObject({
      user: { email: 'admin@example.test', displayName: 'Admin User', role: 'ADMIN' },
    });

    const member = await call(
      '/api/v1/auth/me',
      {},
      {
        'oai-authenticated-user-id': 'site-member',
        'oai-authenticated-user-email': 'member@example.test',
      },
    );
    expect(member.body).toMatchObject({ user: { role: 'MEMBER' } });
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
        name: 'scrscriptipt지원 준비/script',
        items: [expect.objectContaining({ label: '포트폴리오' })],
      }),
    ]);
    expect((listed.body as Array<{ name: string }>)[0]?.name).not.toMatch(/[<>]/);
  });

  it('persists note revisions for the current user', async () => {
    const created = await call('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'D1 메모', markdown: '첫 기록', visibility: 'PRIVATE' }),
    });
    const note = created.body as { id: string };
    await call('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify({
        id: note.id,
        title: 'D1 메모',
        markdown: '두 번째 기록',
        visibility: 'PRIVATE',
      }),
    });

    const listed = await call('/api/v1/notes');
    expect(listed.body).toEqual([
      expect.objectContaining({
        id: note.id,
        markdown: '두 번째 기록',
        currentRev: 2,
        revisions: [
          expect.objectContaining({ revision: 2 }),
          expect.objectContaining({ revision: 1 }),
        ],
      }),
    ]);
  });

  it('loads seeded jobs and persists the application status', async () => {
    const jobs = await call('/api/v1/jobs?sort=new');
    expect(jobs.response.status).toBe(200);
    const firstJob = (jobs.body as unknown as Array<{ id: string }>)[0];
    expect(firstJob).toBeDefined();

    await call('/api/v1/jobs/saved', {
      method: 'POST',
      body: JSON.stringify({ jobId: firstJob.id, status: 'APPLIED', memo: '' }),
    });
    const saved = await call('/api/v1/jobs?sort=new');
    expect(saved.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstJob.id,
          savedBy: [expect.objectContaining({ status: 'APPLIED' })],
        }),
      ]),
    );
  });

  it('persists coding progress, solution, reaction, and comment', async () => {
    const challenge = await call('/api/v1/coding/daily-challenge');
    const daily = challenge.body as unknown as { id: string; problem: { id: string } };
    expect(daily.problem.id).toBeTruthy();

    const solution = await call('/api/v1/coding/solutions', {
      method: 'POST',
      body: JSON.stringify({
        problemId: daily.problem.id,
        title: '테스트 풀이',
        language: 'typescript',
        code: 'return true;',
        description: 'D1에 저장되는 풀이',
        solved: true,
        visibility: 'MEMBERS',
      }),
    });
    const saved = solution.body as { id: string };
    await call(`/api/v1/coding/solutions/${saved.id}/reaction`, { method: 'POST' });
    await call(`/api/v1/coding/solutions/${saved.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ markdown: '좋은 풀이입니다.' }),
    });
    await call(`/api/v1/coding/daily-challenge/${daily.id}/complete`, { method: 'POST' });

    const solutions = await call('/api/v1/coding/solutions');
    expect(solutions.body).toEqual([
      expect.objectContaining({
        id: saved.id,
        reactions: [expect.any(Object)],
        comments: [expect.objectContaining({ markdown: '좋은 풀이입니다.' })],
      }),
    ]);
  });

  it('persists learning review state and returns searchable data', async () => {
    const learning = await call('/api/v1/learning');
    const source = (learning.body as unknown as Array<{ units: Array<{ id: string }> }>)[0];
    expect(source.units.length).toBeGreaterThan(0);
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
              progress: [expect.objectContaining({ completed: true, understanding: 4 })],
            }),
          ]),
        }),
      ]),
    );

    const search = await call('/api/v1/search?q=HTTP');
    expect(search.response.status).toBe(200);
    expect(search.body).toMatchObject({ query: 'HTTP' });
  });
});
