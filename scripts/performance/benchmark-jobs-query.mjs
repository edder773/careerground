/* global console, process */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { DatabaseSync } from 'node:sqlite';

const variant = process.argv[2];
if (!['baseline', 'optimized'].includes(variant)) {
  throw new Error('Usage: node scripts/performance/benchmark-jobs-query.mjs baseline|optimized');
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
database.exec('DELETE FROM jobs;');

const insert = database.prepare(
  `INSERT INTO jobs
     (id, company_name, company_size, source_name, source_url, title, category, region,
      remote, tech_stack, deadline_at, rolling, summary, status, last_verified_at,
      created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const statuses = ['ACTIVE', 'ARCHIVED', 'ARCHIVED', 'ARCHIVED', 'DEADLINE_UNKNOWN'];
const sizes = ['LARGE', 'MID', 'SMALL', 'STARTUP'];
const categories = ['백엔드', '프론트엔드', 'AI/ML', 'DevOps/SRE'];
const source = '2026-08-13T00:00:00.000Z';

database.exec('BEGIN');
for (let index = 0; index < 50_000; index += 1) {
  const createdAt = new Date(Date.UTC(2025, 0, 1) + index * 60_000).toISOString();
  insert.run(
    `job-${index}`,
    `회사 ${String(index % 4_000).padStart(4, '0')}`,
    sizes[index % sizes.length],
    'benchmark-source',
    `https://example.test/jobs/${index}`,
    `신입 개발자 ${index}`,
    categories[index % categories.length],
    '서울',
    index % 2,
    '["TypeScript","SQL"]',
    new Date(Date.UTC(2026, 7, 1) + (index % 60) * 86_400_000).toISOString(),
    0,
    '동일한 데이터 크기에서 채용 목록 조회 계획을 비교하기 위한 합성 레코드입니다.',
    statuses[index % statuses.length],
    source,
    createdAt,
    createdAt,
  );
}
database.exec('COMMIT');
if (variant === 'optimized') {
  migrate('drizzle/0004_melodic_xavin.sql');
}

const select =
  variant === 'baseline'
    ? 'j.*, sj.status AS savedStatus, sj.memo AS savedMemo'
    : `j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
       j.deadline_at, j.rolling, j.summary, j.source_url, j.company_name,
       j.company_size, j.source_name, j.last_verified_at,
       sj.status AS savedStatus, sj.memo AS savedMemo`;
const indexHint = variant === 'optimized' ? ' INDEXED BY idx_jobs_created_status' : '';
const sql = `SELECT ${select}
               FROM jobs j${indexHint}
               LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
              WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
                AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
              ORDER BY j.created_at DESC LIMIT 100`;
const query = database.prepare(sql);

for (let index = 0; index < 20; index += 1) query.all('benchmark-user');
const samples = [];
for (let index = 0; index < 100; index += 1) {
  const start = performance.now();
  query.all('benchmark-user');
  samples.push(performance.now() - start);
}
samples.sort((left, right) => left - right);
const plan = database.prepare(`EXPLAIN QUERY PLAN ${sql}`).all('benchmark-user');

console.log(
  JSON.stringify(
    {
      variant,
      rows: 50_000,
      iterations: samples.length,
      medianMs: Number(samples[Math.floor(samples.length / 2)].toFixed(3)),
      p95Ms: Number(samples[Math.floor(samples.length * 0.95)].toFixed(3)),
      plan: plan.map((row) => row.detail),
    },
    null,
    2,
  ),
);
