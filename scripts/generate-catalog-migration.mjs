import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { stdout } from 'node:process';
import { URL } from 'node:url';

const jobsPath = 'data/imports/careerground_job_postings_47.json';
const problemsPath = 'data/imports/careerground_programmers_problems_427.json';
const migrationPath = 'drizzle/0003_import_careerground_catalog.sql';
const statementBreak = '\n--> statement-breakpoint\n';

const [jobsSource, problemsSource] = await Promise.all([
  readFile(jobsPath, 'utf8'),
  readFile(problemsPath, 'utf8'),
]);
const jobs = JSON.parse(jobsSource);
const problems = JSON.parse(problemsSource);

function requireCatalog(condition, message) {
  if (!condition) throw new Error(message);
}

requireCatalog(jobs.version === '1.0', '채용공고 데이터 버전은 1.0이어야 합니다.');
requireCatalog(jobs.items?.length === 47, '채용공고 데이터는 정확히 47건이어야 합니다.');
requireCatalog(problems.version === '1.0', '문제 데이터 버전은 1.0이어야 합니다.');
requireCatalog(problems.items?.length === 427, '문제 데이터는 정확히 427건이어야 합니다.');
requireCatalog(
  new Set(jobs.items.map((item) => item.sourceUrl)).size === jobs.items.length,
  '채용공고 sourceUrl은 중복될 수 없습니다.',
);
requireCatalog(
  new Set(problems.items.map((item) => item.sourceUrl)).size === problems.items.length,
  '문제 sourceUrl은 중복될 수 없습니다.',
);

const quote = (value) => {
  if (value === undefined || value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const stableId = (prefix, value) => `${prefix}-${hash(value).slice(0, 24)}`;
const lessonId = (sourceUrl) => {
  const match = new URL(sourceUrl).pathname.match(/\/lessons\/(\d+)\/?$/);
  requireCatalog(match, `프로그래머스 lesson ID를 찾을 수 없습니다: ${sourceUrl}`);
  return match[1];
};

const statements = [
  'ALTER TABLE `jobs` ADD `company_size_evidence` text;',
  'ALTER TABLE `jobs` ADD `source_posting_id` text;',
  "ALTER TABLE `jobs` ADD `career_scope` text DEFAULT 'NEW_GRAD_ELIGIBLE' NOT NULL;",
  "ALTER TABLE `jobs` ADD `career_evidence` text DEFAULT '' NOT NULL;",
  "ALTER TABLE `jobs` ADD `employment_type` text DEFAULT 'FULL_TIME' NOT NULL;",
  'ALTER TABLE `jobs` ADD `collected_at` text;',
  "DELETE FROM collection_items WHERE (item_type = 'JOB_POSTING' AND target_id IN ('job-platform-backend', 'job-data-engineer')) OR (item_type = 'LEARNING_UNIT' AND target_id IN ('unit-http', 'unit-database'));",
  "DELETE FROM saved_jobs WHERE job_id IN ('job-platform-backend', 'job-data-engineer');",
  "DELETE FROM jobs WHERE id IN ('job-platform-backend', 'job-data-engineer') OR source_url LIKE 'https://example.com/jobs/%';",
  "DELETE FROM learning_progress WHERE unit_id IN ('unit-http', 'unit-database');",
  "DELETE FROM flashcards WHERE unit_id IN ('unit-http', 'unit-database');",
  "DELETE FROM learning_questions WHERE unit_id IN ('unit-http', 'unit-database');",
  "DELETE FROM learning_units WHERE id IN ('unit-http', 'unit-database');",
  "DELETE FROM learning_sources WHERE id = 'source-web-foundations';",
];

for (const item of jobs.items) {
  const values = [
    stableId('job', item.sourceUrl),
    item.companyName,
    item.companySize,
    item.companySizeEvidence,
    item.sourceName,
    item.sourceId,
    item.sourceUrl,
    item.title,
    item.category,
    item.careerScope,
    item.careerEvidence,
    item.employmentType,
    item.region,
    item.remote,
    JSON.stringify(item.techStack),
    item.deadlineAt,
    item.rolling,
    item.summary,
    item.status,
    item.collectedAt,
    item.lastVerifiedAt,
    item.collectedAt,
    item.lastVerifiedAt,
  ];
  statements.push(`INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES (${values.map(quote).join(', ')})
ON CONFLICT(source_url) DO UPDATE SET
  company_name = excluded.company_name,
  company_size = excluded.company_size,
  company_size_evidence = excluded.company_size_evidence,
  source_name = excluded.source_name,
  source_posting_id = excluded.source_posting_id,
  title = excluded.title,
  category = excluded.category,
  career_scope = excluded.career_scope,
  career_evidence = excluded.career_evidence,
  employment_type = excluded.employment_type,
  region = excluded.region,
  remote = excluded.remote,
  tech_stack = excluded.tech_stack,
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;`);
}

for (const [position, item] of problems.items.entries()) {
  const values = [
    `problem-programmers-${lessonId(item.sourceUrl)}`,
    item.sourceUrl,
    item.title,
    item.level,
    JSON.stringify(item.tags),
    position,
    item.active,
    jobs.collectedAt,
    jobs.collectedAt,
  ];
  statements.push(`INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES (${values.map(quote).join(', ')})
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;`);
}

statements.push(`INSERT OR IGNORE INTO import_batches
  (id, kind, checksum, original_count, rejected_count, created_at)
VALUES
  ('catalog-jobs-20260812', 'jobs', ${quote(hash(jobsSource))}, ${jobs.items.length}, 0, ${quote(jobs.collectedAt)}),
  ('catalog-problems-20260812', 'coding_problems', ${quote(hash(problemsSource))}, ${problems.items.length}, 0, ${quote(jobs.collectedAt)});`);
statements.push('PRAGMA optimize;');

await writeFile(migrationPath, `${statements.join(statementBreak)}\n`, 'utf8');
stdout.write(
  `Generated ${migrationPath}: ${jobs.items.length} jobs, ${problems.items.length} problems`,
);
