import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { canonicalJobUrl, jobFingerprint } from './generate-job-refresh-migration.mjs';

export const reconciliationPaths = {
  existing: 'data/imports/job-refresh-2026-08-14-v2/active.json',
  incoming: 'data/imports/job-refresh-2026-08-20/active.json',
  audit: 'data/imports/job-refresh-2026-08-20/reconciliation.json',
  migration: 'drizzle/0024_reconcile_job_catalog_20260820.sql',
};

const statementBreak = '\n--> statement-breakpoint\n';
const allowedCompanySizes = new Set([
  'LARGE',
  'PUBLIC',
  'MID',
  'SMALL',
  'STARTUP',
  'FOREIGN',
  'UNCLASSIFIED',
]);
const allowedCareerScopes = new Set(['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE']);

function requireCatalog(condition, message) {
  if (!condition) throw new Error(message);
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function quote(value) {
  if (value === undefined || value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function normalizeDate(value) {
  return value ? new Date(value).toISOString() : null;
}

function assertText(value, field, { min = 0, max } = {}) {
  requireCatalog(typeof value === 'string', `${field} must be a string.`);
  const length = value.trim().length;
  requireCatalog(length >= min, `${field} cannot be empty.`);
  if (max !== undefined) requireCatalog(length <= max, `${field} is too long.`);
}

function assertDate(value, field, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return;
  assertText(value, field, { min: 1 });
  requireCatalog(
    /(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && !Number.isNaN(Date.parse(value)),
    `${field} must be an ISO timestamp with a UTC offset.`,
  );
}

function sourceKey(item) {
  return `${item.sourceName}::${item.sourceId || ''}`;
}

function validateJob(item, location) {
  requireCatalog(item && typeof item === 'object', `${location} must be an object.`);
  assertText(item.sourceName, `${location}.sourceName`, { min: 1, max: 80 });
  if (item.sourceId !== undefined && item.sourceId !== null)
    assertText(item.sourceId, `${location}.sourceId`, { max: 200 });
  canonicalJobUrl(item.sourceUrl);
  assertText(item.companyName, `${location}.companyName`, { min: 1, max: 160 });
  assertText(item.title, `${location}.title`, { min: 1, max: 240 });
  assertText(item.category, `${location}.category`, { min: 1, max: 80 });
  requireCatalog(
    allowedCareerScopes.has(item.careerScope),
    `${location}.careerScope must be an entry-level scope.`,
  );
  assertText(item.careerEvidence, `${location}.careerEvidence`, { min: 1, max: 500 });
  requireCatalog(allowedCompanySizes.has(item.companySize), `${location}.companySize is invalid.`);
  if (item.companySizeEvidence !== undefined && item.companySizeEvidence !== null)
    assertText(item.companySizeEvidence, `${location}.companySizeEvidence`, { max: 500 });
  assertText(item.employmentType, `${location}.employmentType`, { min: 1, max: 80 });
  assertText(item.region, `${location}.region`, { min: 1, max: 160 });
  requireCatalog(typeof item.remote === 'boolean', `${location}.remote must be boolean.`);
  requireCatalog(Array.isArray(item.techStack), `${location}.techStack must be an array.`);
  requireCatalog(item.techStack.length <= 30, `${location}.techStack is too large.`);
  item.techStack.forEach((tech, index) =>
    assertText(tech, `${location}.techStack[${index}]`, { min: 1, max: 50 }),
  );
  assertDate(item.publishedAt, `${location}.publishedAt`, true);
  assertDate(item.applicationStartAt, `${location}.applicationStartAt`, true);
  assertDate(item.deadlineAt, `${location}.deadlineAt`, true);
  requireCatalog(typeof item.rolling === 'boolean', `${location}.rolling must be boolean.`);
  assertDate(item.collectedAt, `${location}.collectedAt`);
  assertDate(item.lastVerifiedAt, `${location}.lastVerifiedAt`);
  assertText(item.summary, `${location}.summary`, { min: 1, max: 600 });
  requireCatalog(item.status === 'ACTIVE', `${location}.status must be ACTIVE.`);
}

function assertComparison(actual, expected, field) {
  requireCatalog(actual === expected, `${field} is ${actual}; expected ${expected}.`);
}

export function validateReconciliation(existing, incoming, audit) {
  requireCatalog(existing?.version === '1.0', 'Existing catalog version must be 1.0.');
  requireCatalog(incoming?.version === '1.0', 'Incoming catalog version must be 1.0.');
  requireCatalog(incoming.asOfDate === audit.asOfDate, 'Incoming and audit dates must match.');
  requireCatalog(incoming.timezone === 'Asia/Seoul', 'Incoming timezone must be Asia/Seoul.');
  assertDate(incoming.collectedAt, 'incoming.collectedAt');
  requireCatalog(Array.isArray(existing.items), 'Existing catalog items are missing.');
  requireCatalog(Array.isArray(incoming.items), 'Incoming catalog items are missing.');
  requireCatalog(incoming.items.length > 0, 'Incoming catalog cannot be empty.');
  incoming.items.forEach((item, index) => validateJob(item, `incoming.items[${index}]`));

  const sourceCount = new Set(incoming.items.map((item) => item.sourceName)).size;
  assertComparison(sourceCount, incoming.sourceCount, 'incoming.sourceCount');
  const incomingUrls = incoming.items.map((item) => canonicalJobUrl(item.sourceUrl));
  requireCatalog(
    new Set(incomingUrls).size === incomingUrls.length,
    'Incoming canonical source URLs must be unique.',
  );
  const incomingKeys = incoming.items.map(sourceKey);
  requireCatalog(
    new Set(incomingKeys).size === incomingKeys.length,
    'Incoming source identifiers must be unique.',
  );

  requireCatalog(audit?.version === '1.0', 'Reconciliation audit version must be 1.0.');
  requireCatalog(audit.snapshotMode === 'DELTA', 'Incoming snapshot must be treated as DELTA.');
  assertDate(audit.reconciledAt, 'audit.reconciledAt');
  requireCatalog(Array.isArray(audit.deactivations), 'Audit deactivations are missing.');
  requireCatalog(Array.isArray(audit.rollingVerification), 'Rolling verification is missing.');

  const existingByKey = new Map(existing.items.map((item) => [sourceKey(item), item]));
  const incomingByKey = new Map(incoming.items.map((item) => [sourceKey(item), item]));
  const matched = incoming.items.filter((item) => existingByKey.has(sourceKey(item)));
  const added = incoming.items.filter((item) => !existingByKey.has(sourceKey(item)));
  for (const item of matched) {
    requireCatalog(
      canonicalJobUrl(existingByKey.get(sourceKey(item)).sourceUrl) ===
        canonicalJobUrl(item.sourceUrl),
      `Matched source identifier changed URL: ${sourceKey(item)}`,
    );
  }

  const incomingCollectedAt = Date.parse(incoming.collectedAt);
  for (const row of audit.deactivations) {
    const existingItem = existingByKey.get(sourceKey(row));
    requireCatalog(existingItem, `Deactivation is not in the existing catalog: ${sourceKey(row)}`);
    requireCatalog(
      !incomingByKey.has(sourceKey(row)),
      `Incoming item cannot be deactivated: ${sourceKey(row)}`,
    );
    requireCatalog(
      !existingItem.rolling,
      `Rolling item needs explicit closure evidence: ${sourceKey(row)}`,
    );
    requireCatalog(
      row.status === 'EXPIRED',
      `Deactivation status must be EXPIRED: ${sourceKey(row)}`,
    );
    requireCatalog(
      row.reason === 'DEADLINE_PASSED',
      `Deactivation reason is invalid: ${sourceKey(row)}`,
    );
    requireCatalog(
      existingItem.deadlineAt && Date.parse(existingItem.deadlineAt) < incomingCollectedAt,
      `Deactivation deadline has not passed: ${sourceKey(row)}`,
    );
    requireCatalog(
      canonicalJobUrl(existingItem.sourceUrl) === canonicalJobUrl(row.sourceUrl),
      `Deactivation URL mismatch: ${sourceKey(row)}`,
    );
  }

  const missingRolling = existing.items.filter(
    (item) => item.rolling && !incomingByKey.has(sourceKey(item)),
  );
  const rollingAuditByKey = new Map(
    audit.rollingVerification.map((item) => [sourceKey(item), item]),
  );
  requireCatalog(
    missingRolling.every((item) => rollingAuditByKey.has(sourceKey(item))),
    'Every missing rolling item must have a verification decision.',
  );
  requireCatalog(
    audit.rollingVerification.every((item) =>
      ['ACTIVE_CONFIRMED', 'RETAINED_UNCONFIRMED', 'CLOSED_CONFIRMED'].includes(item.outcome),
    ),
    'Rolling verification outcome is invalid.',
  );
  const closedRolling = missingRolling.filter(
    (item) => rollingAuditByKey.get(sourceKey(item))?.outcome === 'CLOSED_CONFIRMED',
  );

  const storedAfter = new Set([
    ...existing.items.map((item) => canonicalJobUrl(item.sourceUrl)),
    ...incomingUrls,
  ]).size;
  const visibleAfter = storedAfter - audit.deactivations.length - closedRolling.length;
  const counts = {
    existingItems: existing.items.length,
    incomingItems: incoming.items.length,
    matchedItems: matched.length,
    addedItems: added.length,
    expiredByDeadlineItems: audit.deactivations.length,
    retainedExistingRollingItems: missingRolling.length - closedRolling.length,
    storedItemsAfter: storedAfter,
    visibleItemsAfter: visibleAfter,
  };
  for (const [field, value] of Object.entries(counts))
    assertComparison(audit.comparison?.[field], value, `audit.comparison.${field}`);

  return { matched, added, missingRolling, closedRolling, counts };
}

export function generateReconciliationSql({ existingSource, incomingSource, auditSource }) {
  const existing = JSON.parse(existingSource);
  const incoming = JSON.parse(incomingSource);
  const audit = JSON.parse(auditSource);
  const validation = validateReconciliation(existing, incoming, audit);
  const checksum = hash(JSON.stringify([existing, incoming, audit]));
  const appliedAt = normalizeDate(audit.reconciledAt);
  const statements = [];

  for (const rawItem of incoming.items) {
    const item = { ...rawItem, sourceUrl: canonicalJobUrl(rawItem.sourceUrl) };
    const values = [
      `job-${hash(item.sourceUrl).slice(0, 24)}`,
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
      normalizeDate(item.publishedAt),
      normalizeDate(item.applicationStartAt),
      normalizeDate(item.deadlineAt),
      item.rolling,
      item.summary,
      item.status,
      jobFingerprint(item),
      normalizeDate(item.collectedAt),
      normalizeDate(item.lastVerifiedAt),
      normalizeDate(item.collectedAt),
      normalizeDate(item.lastVerifiedAt),
    ];
    statements.push(`INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
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
  published_at = excluded.published_at,
  application_start_at = excluded.application_start_at,
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  fingerprint = excluded.fingerprint,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;`);
  }

  for (const item of audit.deactivations) {
    statements.push(`UPDATE jobs
SET status = 'EXPIRED', updated_at = ${quote(appliedAt)}
WHERE source_url = ${quote(canonicalJobUrl(item.sourceUrl))}
  AND rolling = 0
  AND deadline_at < ${quote(normalizeDate(incoming.collectedAt))};`);
  }

  for (const item of audit.rollingVerification.filter(
    (row) => row.outcome === 'ACTIVE_CONFIRMED',
  )) {
    statements.push(`UPDATE jobs
SET last_verified_at = ${quote(appliedAt)}, updated_at = ${quote(appliedAt)}
WHERE source_url = ${quote(canonicalJobUrl(item.sourceUrl))}
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');`);
  }

  for (const item of audit.rollingVerification.filter(
    (row) => row.outcome === 'CLOSED_CONFIRMED',
  )) {
    statements.push(`UPDATE jobs
SET status = 'REMOVED', last_verified_at = ${quote(appliedAt)}, updated_at = ${quote(appliedAt)}
WHERE source_url = ${quote(canonicalJobUrl(item.sourceUrl))}
  AND rolling = 1;`);
  }

  const result = {
    ...validation.counts,
    snapshotMode: audit.snapshotMode,
    policy: 'delta-upsert; explicit-deadline-expiry; verified-rolling-retention',
  };
  statements.push(`INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260820-delta', 'jobs', ${quote(checksum)}, 'COMMITTED',
   ${incoming.items.length}, 0, ${quote(JSON.stringify(result))}, ${quote(appliedAt)}, ${quote(appliedAt)});`);
  statements.push(`INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0024_reconcile_job_catalog_20260820', ${quote(`sha256:${checksum}`)}, ${quote(appliedAt)});`);
  statements.push('PRAGMA optimize;');

  return { sql: `${statements.join(statementBreak)}\n`, checksum, ...validation };
}

export async function generateJobReconciliation(paths = reconciliationPaths) {
  const [existingSource, incomingSource, auditSource] = await Promise.all([
    readFile(paths.existing, 'utf8'),
    readFile(paths.incoming, 'utf8'),
    readFile(paths.audit, 'utf8'),
  ]);
  const result = generateReconciliationSql({ existingSource, incomingSource, auditSource });
  await writeFile(paths.migration, result.sql, 'utf8');
  return result;
}

const invokedPath = argv[1] ? resolve(argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await generateJobReconciliation();
  stdout.write(
    `Generated ${reconciliationPaths.migration}: ${result.counts.addedItems} added, ${result.counts.matchedItems} updated, ${result.counts.expiredByDeadlineItems} expired, ${result.counts.visibleItemsAfter} visible\n`,
  );
}
