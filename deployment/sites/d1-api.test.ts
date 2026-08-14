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
      expect.objectContaining({ id: folder.id, name: '<scr<script>ipt>지원 준비</script>' }),
    ]);
    await call(`/api/v1/collections/${folder.id}/restore`, { method: 'POST' });
    expect((await call('/api/v1/collections')).body).toEqual([
      expect.objectContaining({
        id: folder.id,
        items: [expect.objectContaining({ label: '포트폴리오' })],
      }),
    ]);
  });

  it('persists note revisions for the current user', async () => {
    const original =
      'List<String>\nvector<pair<int, int>>\na < b && c > d\n<script>alert(1)</script>';
    const created = await call('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'D1 메모', markdown: original, visibility: 'MEMBERS' }),
    });
    const note = created.body as { id: string };
    expect(created.body).toMatchObject({ markdown: original });
    const updated = await call('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify({
        id: note.id,
        baseRevision: 1,
        title: 'D1 메모',
        markdown: '두 번째 기록',
        visibility: 'PRIVATE',
      }),
    });
    expect(updated.response.status).toBe(200);
    const conflict = await call('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify({
        id: note.id,
        baseRevision: 1,
        title: '충돌 저장',
        markdown: '덮어쓰면 안 됩니다.',
      }),
    });
    expect(conflict.response.status).toBe(409);
    expect(conflict.body).toMatchObject({ code: 'REVISION_CONFLICT' });

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
    expect((await call('/api/v1/notes/trash')).body).toEqual([
      expect.objectContaining({ id: note.id, title: 'D1 메모' }),
    ]);
    expect(
      (await call(`/api/v1/notes/${note.id}/restore`, { method: 'POST' })).response.status,
    ).toBe(200);
    expect((await call('/api/v1/notes')).body).toEqual([
      expect.objectContaining({ id: note.id, currentRev: 2 }),
    ]);
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

    expect(jobCount?.count).toBe(121);
    expect(currentJobCount?.count).toBe(120);
    expect(expiredJobCount?.count).toBe(1);
    expect(problemCount?.count).toBe(427);
    expect(sqlProblemCount?.count).toBe(62);
    expect(dummyCount?.count).toBe(0);

    const jobs = await call('/api/v1/jobs?sort=new');
    expect(jobs.response.status).toBe(200);
    expect(jobs.body).toHaveLength(119);
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
      expect.arrayContaining(['AI 풀스택 개발', '백엔드', '프론트엔드']),
    );
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

    const firstJobs = await call('/api/v1/jobs?sort=new&page=cursor&limit=20');
    const jobPage = firstJobs.body as unknown as {
      items: Array<{ id: string }>;
      nextCursor: string;
      total: number;
    };
    expect(jobPage.items).toHaveLength(20);
    expect(jobPage.total).toBe(119);
    const nextJobs = await call(
      `/api/v1/jobs?sort=new&page=cursor&limit=20&cursor=${encodeURIComponent(jobPage.nextCursor)}`,
    );
    expect(
      (nextJobs.body as unknown as { items: Array<{ id: string }> }).items.map((item) => item.id),
    ).not.toContain(jobPage.items.at(-1)?.id);
  });

  it('accepts repeated company-size and category filters', async () => {
    const sizes = await call('/api/v1/jobs?companySize=STARTUP&companySize=FOREIGN');
    const sizeRows = sizes.body as unknown as Array<{ company: { size: string } }>;
    expect(sizeRows.length).toBeGreaterThan(0);
    expect(sizeRows.every((row) => ['STARTUP', 'FOREIGN'].includes(row.company.size))).toBe(true);

    const categories = await call(
      '/api/v1/jobs?category=%EB%B0%B1%EC%97%94%EB%93%9C&category=AI%20%ED%92%80%EC%8A%A4%ED%83%9D%20%EA%B0%9C%EB%B0%9C',
    );
    const categoryRows = categories.body as unknown as Array<{ category: string }>;
    expect(categoryRows.length).toBeGreaterThan(0);
    expect(categoryRows.every((row) => ['백엔드', 'AI 풀스택 개발'].includes(row.category))).toBe(
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
          ],
        },
      ],
    };
    const preview = await call('/api/v1/learning/import/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const token = preview.body as { previewToken: string; checksum: string };
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
    });
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

  it('creates one deduplicated deadline notification across repeated reads', async () => {
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

    const count = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM notifications WHERE type = 'JOB_DEADLINE' AND user_id = (SELECT id FROM users WHERE site_user_id = 'site-admin')",
      )
      .first<{ count: number }>();
    expect(count?.count).toBe(1);
  });

  it('runs scheduled expiry and review notifications under a single lease', async () => {
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

    const result = await runScheduledMaintenance({ DB: db });
    expect(result).toMatchObject({ acquired: true });
    expect(result.expiredJobs).toBeGreaterThan(0);
    expect(result.notifications).toBe(1);

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

  it('loads the learning summary library with two bounded queries', async () => {
    db.resetPreparedSql();
    const learning = await call('/api/v1/learning');
    const learningQueries = db.preparedSql.filter((sql) =>
      /FROM (learning_sources|learning_units|flashcards|learning_questions)/.test(sql),
    );

    expect(learning.response.status).toBe(200);
    expect(learningQueries).toHaveLength(2);
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
    const approval = preview.body as { previewToken: string; checksum: string };
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
      const approval = preview.body as { previewToken: string; checksum: string };
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
});
