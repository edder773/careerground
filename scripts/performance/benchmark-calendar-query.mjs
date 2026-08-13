/* global console, process */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { DatabaseSync } from 'node:sqlite';

const variant = process.argv[2];
if (!['baseline', 'optimized'].includes(variant)) {
  throw new Error(
    'Usage: node scripts/performance/benchmark-calendar-query.mjs baseline|optimized',
  );
}

const database = new DatabaseSync(':memory:');
database.exec(
  'PRAGMA journal_mode = MEMORY; PRAGMA synchronous = OFF; PRAGMA temp_store = MEMORY;',
);

function migrate(file) {
  for (const statement of readFileSync(file, 'utf8').split('--> statement-breakpoint')) {
    if (statement.trim()) database.exec(statement);
  }
}

migrate('drizzle/0000_loose_shooting_star.sql');
migrate('drizzle/0003_import_careerground_catalog.sql');
migrate('drizzle/0004_melodic_xavin.sql');
database.exec('DELETE FROM jobs;');

const insert = database.prepare(
  `INSERT INTO jobs
     (id, company_name, company_size, source_name, source_url, title, category, career_scope,
      region, remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
      last_verified_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const statuses = ['ACTIVE', 'ACTIVE', 'ARCHIVED', 'DEADLINE_UNKNOWN'];
const careerScopes = ['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'CAREER_ONLY'];
const sizes = ['LARGE', 'MID', 'SMALL', 'STARTUP'];
const categories = ['백엔드', '프론트엔드', 'AI/ML', 'DevOps/SRE'];

database.exec('BEGIN');
for (let index = 0; index < 50_000; index += 1) {
  const createdAt = new Date(Date.UTC(2026, 0, 1) + index * 60_000).toISOString();
  const collectedAt =
    index % 11 === 0
      ? null
      : new Date(Date.UTC(2026, 0, 1) + (index % 240) * 86_400_000).toISOString();
  insert.run(
    `job-${index}`,
    `회사 ${String(index % 4_000).padStart(4, '0')}`,
    sizes[index % sizes.length],
    'benchmark-source',
    `https://example.test/jobs/${index}`,
    `신입 개발자 ${index}`,
    categories[index % categories.length],
    careerScopes[index % careerScopes.length],
    '서울',
    index % 2,
    '["TypeScript","SQL"]',
    new Date(Date.UTC(2026, 0, 1) + (index % 180) * 86_400_000).toISOString(),
    index % 31 === 0 ? 1 : 0,
    '동일한 데이터 크기에서 채용 달력 조회 계획을 비교하기 위한 합성 레코드입니다.',
    statuses[index % statuses.length],
    collectedAt,
    createdAt,
    createdAt,
    createdAt,
  );
}
database.exec('COMMIT');

if (variant === 'optimized') {
  migrate('drizzle/0006_tense_iron_patriot.sql');
}

const from = '2026-02-01T00:00:00.000Z';
const to = '2026-03-01T00:00:00.000Z';
const baselineSql = `SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
                            j.collected_at, j.deadline_at, j.rolling, j.summary, j.source_url,
                            j.company_name, j.company_size, j.source_name, j.last_verified_at,
                            sj.status AS savedStatus, sj.memo AS savedMemo
                       FROM jobs j
                       LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
                      WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
                        AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
                        AND ((j.deadline_at >= ? AND j.deadline_at < ?)
                          OR (COALESCE(j.collected_at, j.created_at) >= ?
                            AND COALESCE(j.collected_at, j.created_at) < ?)
                          OR j.rolling = 1)
                      ORDER BY j.deadline_at ASC LIMIT 100`;
const optimizedBranches = [
  {
    index: 'idx_jobs_calendar_deadline',
    where: 'j.deadline_at >= ? AND j.deadline_at < ?',
    values: [from, to],
  },
  {
    index: 'idx_jobs_calendar_collected',
    where: 'j.collected_at >= ? AND j.collected_at < ?',
    values: [from, to],
  },
  {
    index: 'idx_jobs_calendar_created',
    where: 'j.collected_at IS NULL AND j.created_at >= ? AND j.created_at < ?',
    values: [from, to],
  },
  { index: 'idx_jobs_calendar_rolling', where: 'j.rolling = 1', values: [] },
].map((branch) => ({
  sql: `SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
               j.collected_at, j.deadline_at, j.rolling, j.summary, j.source_url,
               j.company_name, j.company_size, j.source_name, j.last_verified_at,
               sj.status AS savedStatus, sj.memo AS savedMemo
          FROM jobs j INDEXED BY ${branch.index}
          LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
         WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
           AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
           AND ${branch.where}
         LIMIT 100`,
  values: ['benchmark-user', ...branch.values],
}));
const queries =
  variant === 'baseline'
    ? [
        {
          query: database.prepare(baselineSql),
          sql: baselineSql,
          values: ['benchmark-user', from, to, from, to],
        },
      ]
    : optimizedBranches.map((branch) => ({
        query: database.prepare(branch.sql),
        sql: branch.sql,
        values: branch.values,
      }));

function runQueries() {
  const unique = new Set();
  for (const item of queries) {
    for (const row of item.query.all(...item.values)) unique.add(row.id);
  }
  return unique.size;
}

for (let index = 0; index < 10; index += 1) runQueries();
const samples = [];
for (let index = 0; index < 50; index += 1) {
  const start = performance.now();
  runQueries();
  samples.push(performance.now() - start);
}
samples.sort((left, right) => left - right);
const plan = queries.flatMap((item) =>
  database
    .prepare(`EXPLAIN QUERY PLAN ${item.sql}`)
    .all(...item.values)
    .map((row) => String(Object.values(row).at(-1))),
);

console.log(
  JSON.stringify(
    {
      variant,
      rows: 50_000,
      iterations: samples.length,
      medianMs: Number(samples[Math.floor(samples.length / 2)].toFixed(3)),
      p95Ms: Number(samples[Math.floor(samples.length * 0.95)].toFixed(3)),
      plan,
    },
    null,
    2,
  ),
);
