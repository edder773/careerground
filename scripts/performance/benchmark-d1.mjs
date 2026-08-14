/* global console, process, Request */
import { performance } from 'node:perf_hooks';
import { handleD1Api } from '../../deployment/sites/d1-api.ts';
import { LocalD1 } from '../../deployment/sites/local-d1.ts';

const sizes = {
  jobs: 50_000,
  codingProblems: 10_000,
  solutions: 20_000,
  comments: 100_000,
  notesPerUser: 1_000,
  notificationsPerUser: 10_000,
};
const now = '2026-08-13T00:00:00.000Z';
const db = new LocalD1();
const headers = {
  'oai-authenticated-user-id': 'performance-user',
  'oai-authenticated-user-email': 'performance@example.test',
  'oai-authenticated-user-full-name': 'Performance%20User',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
};

async function api(path) {
  return handleD1Api(new Request(`https://benchmark.invalid/api/v1${path}`, { headers }), {
    DB: db,
    OPENAI_ADMIN_EMAILS: '',
    MAX_ACTIVE_USERS: '100',
    REQUEST_LOGGING: 'false',
  });
}

const auth = await api('/auth/me');
if (!auth.ok) throw new Error(`benchmark user setup failed: ${auth.status}`);
const userId = (await auth.json()).user.id;

async function insertChunks(count, makeStatements, chunkSize = 500) {
  for (let start = 0; start < count; start += chunkSize) {
    const statements = [];
    for (let index = start; index < Math.min(start + chunkSize, count); index += 1) {
      statements.push(...makeStatements(index));
    }
    await db.batch(statements);
  }
}

const seedStarted = performance.now();
await insertChunks(sizes.jobs, (index) => [
  db
    .prepare(
      `INSERT INTO jobs
       (id, company_name, company_size, source_name, source_url, title, category, region,
        remote, tech_stack, deadline_at, rolling, summary, status, last_verified_at,
        career_scope, career_evidence, employment_type, created_at, updated_at)
       VALUES (?, ?, 'STARTUP', 'synthetic', ?, ?, ?, '서울', 0, ?, NULL, 1, ?, 'ACTIVE', ?,
               'NEW_GRAD_ELIGIBLE', '합성 성능 데이터', 'FULL_TIME', ?, ?)`,
    )
    .bind(
      `perf-job-${index}`,
      `Synthetic Company ${index % 500}`,
      `https://benchmark.invalid/jobs/${index}`,
      `Synthetic backend job ${index}`,
      index % 2 ? 'BACKEND' : 'DATA',
      JSON.stringify(['TypeScript', 'SQL']),
      `Synthetic summary ${index}`,
      now,
      now,
      now,
    ),
]);
await insertChunks(sizes.codingProblems, (index) => [
  db
    .prepare(
      `INSERT INTO coding_problems
       (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .bind(
      `perf-problem-${index}`,
      `https://benchmark.invalid/problems/${index}`,
      `Synthetic problem ${index}`,
      index % 6,
      JSON.stringify(['synthetic']),
      index,
      now,
      now,
    ),
]);
await insertChunks(sizes.solutions, (index) => [
  db
    .prepare(
      `INSERT INTO solutions
       (id, problem_id, author_id, title, language, code, description, lessons, solved,
        visibility, current_rev, solved_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'javascript', ?, ?, '', 1, 'MEMBERS', 1, ?, ?, ?)`,
    )
    .bind(
      `perf-solution-${index}`,
      `perf-problem-${index % sizes.codingProblems}`,
      userId,
      `Synthetic solution ${index}`,
      `export const solve = (value) => value + ${index % 10};`,
      `Synthetic explanation ${index}`,
      now,
      now,
      now,
    ),
  db
    .prepare(
      `INSERT INTO solution_revisions
       (id, solution_id, revision, code, description, created_at)
       VALUES (?, ?, 1, ?, ?, ?)`,
    )
    .bind(
      `perf-revision-${index}`,
      `perf-solution-${index}`,
      `export const solve = (value) => value + ${index % 10};`,
      `Synthetic explanation ${index}`,
      now,
    ),
]);
await insertChunks(sizes.comments, (index) => [
  db
    .prepare(
      `INSERT INTO solution_comments
       (id, solution_id, author_id, parent_id, markdown, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?)`,
    )
    .bind(
      `perf-comment-${index}`,
      `perf-solution-${index % sizes.solutions}`,
      userId,
      `Synthetic comment ${index}`,
      now,
      now,
    ),
]);
await insertChunks(sizes.notesPerUser, (index) => [
  db
    .prepare(
      `INSERT INTO notes
       (id, user_id, title, markdown, visibility, current_rev, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'PRIVATE', 1, ?, ?)`,
    )
    .bind(
      `perf-note-${index}`,
      userId,
      `Synthetic note ${index}`,
      `# Synthetic note ${index}\n\nList<String> and a < b`,
      now,
      now,
    ),
  db
    .prepare(
      `INSERT INTO note_revisions (id, note_id, revision, markdown, created_at)
       VALUES (?, ?, 1, ?, ?)`,
    )
    .bind(
      `perf-note-revision-${index}`,
      `perf-note-${index}`,
      `# Synthetic note ${index}\n\nList<String> and a < b`,
      now,
    ),
]);
await insertChunks(sizes.notificationsPerUser, (index) => [
  db
    .prepare(
      `INSERT INTO notifications
       (id, user_id, type, title, message, href, created_at)
       VALUES (?, ?, 'SYSTEM', ?, ?, '/', ?)`,
    )
    .bind(
      `perf-notification-${index}`,
      userId,
      `Synthetic notification ${index}`,
      `Synthetic message ${index}`,
      now,
    ),
]);
const seedDurationMs = performance.now() - seedStarted;

const percentile = (values, ratio) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
};

async function measure(path) {
  await api(path);
  const samples = [];
  let payloadBytes = 0;
  let queryCount = 0;
  let peakRssBytes = 0;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    db.resetQueryCount();
    const started = performance.now();
    const response = await api(path);
    const bytes = (await response.arrayBuffer()).byteLength;
    samples.push(performance.now() - started);
    payloadBytes = bytes;
    queryCount = Math.max(queryCount, db.getQueryCount());
    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
    if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  }
  return {
    p50Ms: Number(percentile(samples, 0.5).toFixed(2)),
    p95Ms: Number(percentile(samples, 0.95).toFixed(2)),
    dbQueryCount: queryCount,
    responseBytes: payloadBytes,
    peakRssBytes,
  };
}

const metrics = {
  jobs: await measure('/jobs'),
  jobsCursor: await measure('/jobs?page=cursor&limit=40'),
  jobsFilter: await measure('/jobs?category=BACKEND'),
  codingProblems: await measure('/coding/problems'),
  codingProblemsCursor: await measure('/coding/problems?page=cursor&limit=60'),
  solutions: await measure('/coding/solutions'),
  solutionsCursor: await measure('/coding/solutions?page=cursor&limit=10'),
  notes: await measure('/notes'),
  notifications: await measure('/notifications'),
  search: await measure('/search?q=Synthetic'),
};
const payloadReductionPercent = (legacy, cursor) =>
  Number((100 - (cursor.responseBytes / legacy.responseBytes) * 100).toFixed(1));
const paginationComparison = {
  jobs: {
    legacyBytes: metrics.jobs.responseBytes,
    cursorBytes: metrics.jobsCursor.responseBytes,
    reductionPercent: payloadReductionPercent(metrics.jobs, metrics.jobsCursor),
  },
  codingProblems: {
    legacyBytes: metrics.codingProblems.responseBytes,
    cursorBytes: metrics.codingProblemsCursor.responseBytes,
    reductionPercent: payloadReductionPercent(metrics.codingProblems, metrics.codingProblemsCursor),
  },
  solutions: {
    legacyBytes: metrics.solutions.responseBytes,
    cursorBytes: metrics.solutionsCursor.responseBytes,
    reductionPercent: payloadReductionPercent(metrics.solutions, metrics.solutionsCursor),
  },
};

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      environment: {
        runtime: process.version,
        database: 'node:sqlite in-memory D1 compatibility adapter',
        scope: 'synthetic local API benchmark; not production D1/network latency',
      },
      dataset: sizes,
      seedDurationMs: Number(seedDurationMs.toFixed(2)),
      samplesPerEndpoint: 7,
      metrics,
      paginationComparison,
      browserMetrics: {
        initialRenderTime: '정량 측정 불가',
        filterChangeTime: '정량 측정 불가',
        reason: '브라우저 성능 추적과 운영 D1 자격증명이 이번 로컬 측정 범위에 없음',
      },
      beforeComparison: {
        status: '정량 측정 불가',
        reason: '감사 전 동일 커밋·동일 합성 데이터의 측정 산출물이 없음',
      },
    },
    null,
    2,
  ),
);

db.close();
