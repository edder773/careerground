import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { stdout } from 'node:process';

const previousPath = 'data/imports/careerground_job_postings_47.json';
const currentPath = 'data/imports/careerground_job_postings_120_2026-08-13.json';
const migrationPath = 'drizzle/0009_refresh_job_catalog.sql';
const statementBreak = '\n--> statement-breakpoint\n';

const [previousSource, currentSource] = await Promise.all([
  readFile(previousPath, 'utf8'),
  readFile(currentPath, 'utf8'),
]);
const previous = JSON.parse(previousSource);
const current = JSON.parse(currentSource);

function requireCatalog(condition, message) {
  if (!condition) throw new Error(message);
}

requireCatalog(current.version === '1.0', '채용공고 데이터 버전은 1.0이어야 합니다.');
requireCatalog(current.items?.length === 120, '채용공고 데이터는 정확히 120건이어야 합니다.');
requireCatalog(current.sourceCount === 11, '채용공고 출처는 정확히 11개여야 합니다.');
requireCatalog(
  new Set(current.items.map((item) => item.sourceUrl)).size === current.items.length,
  '채용공고 sourceUrl은 중복될 수 없습니다.',
);
requireCatalog(
  new Set(current.items.map((item) => `${item.sourceName}::${item.sourceId}`)).size ===
    current.items.length,
  '채용공고 출처별 sourceId는 중복될 수 없습니다.',
);

const quote = (value) => {
  if (value === undefined || value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const stableId = (prefix, value) => `${prefix}-${hash(value).slice(0, 24)}`;
const currentUrls = new Set(current.items.map((item) => item.sourceUrl));
const removedUrls = previous.items
  .map((item) => item.sourceUrl)
  .filter((sourceUrl) => !currentUrls.has(sourceUrl));
const statements = [];

if (removedUrls.length) {
  statements.push(`UPDATE jobs
SET status = 'EXPIRED', updated_at = ${quote(current.collectedAt)}
WHERE source_url IN (${removedUrls.map(quote).join(', ')});`);
}

for (const item of current.items) {
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

statements.push(`INSERT OR IGNORE INTO import_batches
  (id, kind, checksum, original_count, rejected_count, created_at)
VALUES
  ('catalog-jobs-20260813', 'jobs', ${quote(hash(JSON.stringify(current)))}, ${current.items.length}, 0, ${quote(current.collectedAt)});`);
statements.push('PRAGMA optimize;');

await writeFile(migrationPath, `${statements.join(statementBreak)}\n`, 'utf8');
stdout.write(
  `Generated ${migrationPath}: ${current.items.length} current jobs, ${removedUrls.length} expired`,
);
