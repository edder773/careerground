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
    for (const file of [
      'drizzle/0000_loose_shooting_star.sql',
      'drizzle/0001_seed.sql',
      'drizzle/0002_equal_hulk.sql',
      'drizzle/0003_import_careerground_catalog.sql',
      'drizzle/0004_melodic_xavin.sql',
      'drizzle/0005_naive_blindfold.sql',
    ]) {
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

const memberHeaders = {
  'oai-authenticated-user-id': 'site-member',
  'oai-authenticated-user-email': 'member@example.test',
  'oai-authenticated-user-full-name': 'Member%20User',
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
      user: {
        email: 'admin@example.test',
        displayName: 'Admin User',
        role: 'ADMIN',
        preferredLanguage: 'javascript',
        onboardingCompleted: false,
      },
    });

    const member = await call('/api/v1/auth/me', {}, memberHeaders);
    expect(member.body).toMatchObject({
      user: { role: 'MEMBER', onboardingCompleted: false },
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
      body: JSON.stringify({ title: 'D1 메모', markdown: '첫 기록', visibility: 'MEMBERS' }),
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
        visibility: 'PRIVATE',
        currentRev: 2,
        revisions: [
          expect.objectContaining({ revision: 2 }),
          expect.objectContaining({ revision: 1 }),
        ],
      }),
    ]);

    const otherUserNotes = await call('/api/v1/notes', {}, memberHeaders);
    expect(otherUserNotes.body).toEqual([]);
    const removed = await call(`/api/v1/notes/${note.id}`, { method: 'DELETE' });
    expect(removed.response.status).toBe(200);
    expect((await call('/api/v1/notes')).body).toEqual([]);
  });

  it('replaces dummy records with the imported job and problem catalogs', async () => {
    const jobCount = await db
      .prepare('SELECT COUNT(*) AS count FROM jobs')
      .first<{ count: number }>();
    const problemCount = await db
      .prepare('SELECT COUNT(*) AS count FROM coding_problems WHERE active = 1')
      .first<{ count: number }>();
    const dummyCount = await db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM jobs WHERE source_url LIKE 'https://example.com/jobs/%') +
          (SELECT COUNT(*) FROM learning_sources WHERE id = 'source-web-foundations') AS count`,
      )
      .first<{ count: number }>();

    expect(jobCount?.count).toBe(47);
    expect(problemCount?.count).toBe(427);
    expect(dummyCount?.count).toBe(0);

    const jobs = await call('/api/v1/jobs?sort=new');
    expect(jobs.response.status).toBe(200);
    expect(jobs.body).toHaveLength(46);
    expect(jobs.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fullstack Engineer',
          company: expect.objectContaining({ name: 'Hudson AI' }),
        }),
      ]),
    );
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

  it('returns compact distinct job categories', async () => {
    const categories = await call('/api/v1/jobs/categories');
    expect(categories.response.status).toBe(200);
    expect(categories.body).toEqual(
      expect.arrayContaining(['AI 풀스택 개발', '백엔드', '프론트엔드']),
    );
  });

  it('limits calendar queries to the requested deadline month', async () => {
    const september = await call(
      '/api/v1/jobs?sort=deadline&deadlineFrom=2026-08-31T15%3A00%3A00.000Z&deadlineTo=2026-09-30T15%3A00%3A00.000Z',
    );
    expect(september.response.status).toBe(200);
    const septemberRows = september.body as unknown as Array<{ deadlineAt: string }>;
    expect(septemberRows.length).toBeGreaterThan(0);

    const august = await call(
      '/api/v1/jobs?sort=deadline&deadlineFrom=2026-07-31T15%3A00%3A00.000Z&deadlineTo=2026-08-31T15%3A00%3A00.000Z',
    );
    const augustRows = august.body as unknown as Array<{ deadlineAt: string }>;
    expect(augustRows.length).toBeGreaterThan(septemberRows.length);
    expect(
      augustRows.every((row) => {
        const value = Date.parse(row.deadlineAt);
        return (
          value >= Date.parse('2026-07-31T15:00:00.000Z') &&
          value < Date.parse('2026-08-31T15:00:00.000Z')
        );
      }),
    ).toBe(true);

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
    const challenges = await call('/api/v1/coding/daily-challenges');
    expect(challenges.body).toEqual([
      expect.objectContaining({ levelSlot: 1, problem: expect.objectContaining({ level: 1 }) }),
      expect.objectContaining({ levelSlot: 2, problem: expect.objectContaining({ level: 2 }) }),
    ]);
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
    await call(`/api/v1/coding/solutions/${saved.id}/reaction`, { method: 'POST' });
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
        reactions: [expect.any(Object)],
        comments: [expect.objectContaining({ markdown: '좋은 풀이입니다.' })],
      }),
    ]);
  });

  it('persists learning review state and returns searchable data', async () => {
    const reconstructed = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM learning_units WHERE source_id = 'source-generative-ai-context'",
      )
      .first<{ count: number }>();
    expect(reconstructed?.count).toBe(6);
    const imported = await call('/api/v1/learning/import/commit', {
      method: 'POST',
      body: JSON.stringify({
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
            summaryMarkdown: '요청과 응답의 구조를 학습합니다.',
            concepts: ['HTTP'],
            flashcards: [{ front: '멱등한 요청이란?', back: '반복해도 최종 상태가 같습니다.' }],
            questions: [
              {
                type: 'SHORT_ANSWER',
                prompt: '생성 성공 상태 코드는?',
                answer: '201 Created',
              },
            ],
          },
        ],
      }),
    });
    expect(imported.response.status).toBe(200);

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
