import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath, URL } from 'node:url';

export const catalogPaths = {
  active: 'data/imports/job-refresh-2026-08-14-v2/active.json',
  uncertain: 'data/imports/job-refresh-2026-08-14-v2/uncertain.json',
  excluded: 'data/imports/job-refresh-2026-08-14-v2/excluded.json',
  audit: 'data/imports/job-refresh-2026-08-14-v2/audit.json',
  migration: 'drizzle/0020_replace_job_catalog_20260814_verified.sql',
};

const expectedCounts = { active: 51, uncertain: 0, excluded: 19 };
const statementBreak = '\n--> statement-breakpoint\n';
const companySizes = new Set([
  'LARGE',
  'PUBLIC',
  'MID',
  'SMALL',
  'STARTUP',
  'FOREIGN',
  'UNCLASSIFIED',
]);
const careerScopes = new Set(['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'CAREER_ONLY']);
const jobStatuses = new Set(['ACTIVE', 'DEADLINE_UNKNOWN', 'EXPIRED', 'REMOVED', 'NEEDS_REVIEW']);

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
  return value ? new Date(value).toISOString() : value;
}

function assertString(value, field, { min = 0, max } = {}) {
  requireCatalog(typeof value === 'string', `${field}은(는) 문자열이어야 합니다.`);
  const length = value.trim().length;
  requireCatalog(length >= min, `${field}은(는) 비어 있을 수 없습니다.`);
  if (max !== undefined)
    requireCatalog(length <= max, `${field}은(는) ${max}자를 넘을 수 없습니다.`);
}

function assertDate(value, field, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return;
  assertString(value, field, { min: 1 });
  requireCatalog(
    /(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && !Number.isNaN(Date.parse(value)),
    `${field}은(는) UTC 오프셋이 있는 ISO 날짜여야 합니다.`,
  );
}

export function canonicalJobUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`채용공고 URL이 올바르지 않습니다: ${value}`);
  }
  requireCatalog(
    ['http:', 'https:'].includes(url.protocol),
    `채용공고 URL은 http(s)만 허용됩니다: ${value}`,
  );
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_(source|medium|campaign|term|content)|fbclid|gclid)$/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

function normalizeCompanyName(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/주식회사/g, '')
    .replace(/\(주\)|㈜/g, '')
    .replace(/[\s().,_-]/g, '');
}

export function jobFingerprint(item) {
  const url = new URL(canonicalJobUrl(item.sourceUrl));
  return hash(
    [
      url.hostname,
      item.sourceId || '',
      normalizeCompanyName(item.companyName),
      item.title.normalize('NFKC').trim().toLowerCase(),
      item.region.normalize('NFKC').trim().toLowerCase(),
      item.deadlineAt || '',
      item.careerScope,
      item.employmentType,
    ].join('\u001f'),
  );
}

function validateJobItem(item, location) {
  requireCatalog(item && typeof item === 'object', `${location} 항목이 객체가 아닙니다.`);
  assertString(item.sourceName, `${location}.sourceName`, { min: 1, max: 80 });
  if (item.sourceId !== undefined && item.sourceId !== null) {
    assertString(item.sourceId, `${location}.sourceId`, { max: 200 });
  }
  canonicalJobUrl(item.sourceUrl);
  assertString(item.companyName, `${location}.companyName`, { min: 1, max: 160 });
  assertString(item.title, `${location}.title`, { min: 1, max: 240 });
  assertString(item.category, `${location}.category`, { min: 1, max: 80 });
  requireCatalog(
    careerScopes.has(item.careerScope),
    `${location}.careerScope 값이 올바르지 않습니다.`,
  );
  requireCatalog(
    item.careerScope !== 'CAREER_ONLY',
    `${location}에 경력직 전용 공고를 넣을 수 없습니다.`,
  );
  assertString(item.careerEvidence, `${location}.careerEvidence`, { min: 1, max: 500 });
  requireCatalog(
    companySizes.has(item.companySize),
    `${location}.companySize 값이 올바르지 않습니다.`,
  );
  if (item.companySizeEvidence !== undefined && item.companySizeEvidence !== null) {
    assertString(item.companySizeEvidence, `${location}.companySizeEvidence`, { max: 500 });
  }
  assertString(item.employmentType, `${location}.employmentType`, { max: 80 });
  assertString(item.region, `${location}.region`, { max: 160 });
  requireCatalog(typeof item.remote === 'boolean', `${location}.remote는 boolean이어야 합니다.`);
  requireCatalog(Array.isArray(item.techStack), `${location}.techStack은 배열이어야 합니다.`);
  requireCatalog(item.techStack.length <= 30, `${location}.techStack은 30개를 넘을 수 없습니다.`);
  for (const [index, value] of item.techStack.entries()) {
    assertString(value, `${location}.techStack[${index}]`, { min: 1, max: 50 });
  }
  assertDate(item.publishedAt, `${location}.publishedAt`, true);
  assertDate(item.deadlineAt, `${location}.deadlineAt`, true);
  requireCatalog(typeof item.rolling === 'boolean', `${location}.rolling은 boolean이어야 합니다.`);
  assertDate(item.collectedAt, `${location}.collectedAt`);
  assertDate(item.lastVerifiedAt, `${location}.lastVerifiedAt`);
  assertString(item.summary, `${location}.summary`, { max: 600 });
  requireCatalog(jobStatuses.has(item.status), `${location}.status 값이 올바르지 않습니다.`);
}

function validateCollection(source, kind) {
  requireCatalog(source?.version === '1.0', `${kind} 데이터 버전은 1.0이어야 합니다.`);
  assertDate(source.collectedAt, `${kind}.collectedAt`);
  requireCatalog(Array.isArray(source.items), `${kind}.items는 배열이어야 합니다.`);
  requireCatalog(
    source.items.length === expectedCounts[kind],
    `${kind} 데이터는 정확히 ${expectedCounts[kind]}건이어야 합니다.`,
  );
  const sources = new Set(source.items.map((item) => item.sourceName));
  requireCatalog(
    source.sourceCount === sources.size,
    `${kind}.sourceCount가 실제 출처 수와 다릅니다.`,
  );
  source.items.forEach((item, index) => validateJobItem(item, `${kind}.items[${index}]`));
}

function validateExcluded(source) {
  assertDate(source?.generatedAt, 'excluded.generatedAt');
  requireCatalog(Array.isArray(source.items), 'excluded.items는 배열이어야 합니다.');
  requireCatalog(
    source.items.length === expectedCounts.excluded,
    `excluded 데이터는 정확히 ${expectedCounts.excluded}건이어야 합니다.`,
  );
  source.items.forEach((item, index) => {
    const location = `excluded.items[${index}]`;
    assertString(item.sourceName, `${location}.sourceName`, { min: 1, max: 80 });
    canonicalJobUrl(item.sourceUrl);
    assertString(item.companyName, `${location}.companyName`, { min: 1, max: 160 });
    assertString(item.title, `${location}.title`, { min: 1, max: 240 });
    assertDate(item.excludedAt, `${location}.excludedAt`);
    assertString(item.reasonCode, `${location}.reasonCode`, { min: 1, max: 80 });
    assertString(item.reasonDetail, `${location}.reasonDetail`, { min: 1, max: 600 });
  });
}

export function validateCatalogs(active, uncertain, excluded) {
  validateCollection(active, 'active');
  validateCollection(uncertain, 'uncertain');
  validateExcluded(excluded);
  requireCatalog(
    active.items.every((item) => item.status === 'ACTIVE'),
    'active 데이터에는 ACTIVE 공고만 들어갈 수 있습니다.',
  );
  requireCatalog(
    uncertain.items.every((item) => ['DEADLINE_UNKNOWN', 'NEEDS_REVIEW'].includes(item.status)),
    'uncertain 데이터에는 DEADLINE_UNKNOWN 또는 NEEDS_REVIEW 공고만 들어갈 수 있습니다.',
  );
  requireCatalog(
    active.collectedAt === uncertain.collectedAt,
    'active와 uncertain의 수집 시각이 일치해야 합니다.',
  );

  const included = [...active.items, ...uncertain.items].map((item) => ({
    ...item,
    sourceUrl: canonicalJobUrl(item.sourceUrl),
  }));
  const canonicalUrls = included.map((item) => item.sourceUrl);
  requireCatalog(
    new Set(canonicalUrls).size === included.length,
    '반영 대상의 canonical sourceUrl은 중복될 수 없습니다.',
  );
  const sourceIds = included.map((item) => `${item.sourceName}::${item.sourceId || ''}`);
  requireCatalog(
    new Set(sourceIds).size === included.length,
    '반영 대상의 출처별 sourceId는 중복될 수 없습니다.',
  );

  const includedByUrl = new Map(included.map((item) => [item.sourceUrl, item]));
  const overlapUrls = new Set(
    excluded.items
      .map((item) => canonicalJobUrl(item.sourceUrl))
      .filter((sourceUrl) => includedByUrl.has(sourceUrl)),
  );
  requireCatalog(
    [...overlapUrls].every((sourceUrl) => includedByUrl.get(sourceUrl)?.status === 'NEEDS_REVIEW'),
    '제외 목록과 겹치는 URL은 NEEDS_REVIEW 상태로만 보관할 수 있습니다.',
  );

  return {
    included,
    overlapUrls: [...overlapUrls],
    counts: {
      active: active.items.length,
      deadlineUnknown: included.filter((item) => item.status === 'DEADLINE_UNKNOWN').length,
      needsReview: included.filter((item) => item.status === 'NEEDS_REVIEW').length,
      excluded: excluded.items.length,
      stored: included.length,
      visible: included.filter((item) => ['ACTIVE', 'DEADLINE_UNKNOWN'].includes(item.status))
        .length,
    },
  };
}

function countBy(items, select) {
  return Object.fromEntries(
    [
      ...items.reduce((counts, item) => {
        const key = select(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map()),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function assertCountMap(actual, expected, field) {
  const normalize = (value) =>
    Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right, 'en'));
  requireCatalog(
    JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected)),
    `${field}가 실제 반영 대상 집계와 다릅니다.`,
  );
}

export function validateAudit(audit, validation, active, excluded) {
  requireCatalog(audit?.version === '1.0', 'audit 데이터 버전은 1.0이어야 합니다.');
  requireCatalog(audit.asOfDate === '2026-08-14', 'audit.asOfDate가 교체 기준일과 다릅니다.');
  requireCatalog(audit.timezone === 'Asia/Seoul', 'audit.timezone은 Asia/Seoul이어야 합니다.');
  requireCatalog(
    audit.completionStatus === 'PARTIAL_RETROSPECTIVE_WITH_USER_MANUAL_CONFIRMATION',
    'audit.completionStatus가 승인된 수집 상태와 다릅니다.',
  );
  assertDate(audit.collectionStartedAt, 'audit.collectionStartedAt');
  assertDate(audit.collectionFinishedAt, 'audit.collectionFinishedAt');
  assertDate(audit.secondPassVerificationFinishedAt, 'audit.secondPassVerificationFinishedAt');

  requireCatalog(
    audit.counts?.activeItems === validation.counts.active,
    'audit active 집계가 다릅니다.',
  );
  requireCatalog(
    audit.counts?.deadlineUnknownItems === validation.counts.deadlineUnknown,
    'audit deadline-unknown 집계가 다릅니다.',
  );
  requireCatalog(
    audit.counts?.needsReviewItems === validation.counts.needsReview,
    'audit needs-review 집계가 다릅니다.',
  );
  requireCatalog(
    audit.counts?.totalCandidates === validation.counts.stored + validation.counts.excluded,
    'audit 전체 후보 집계가 다릅니다.',
  );

  const excludedCounts = countBy(excluded.items, (item) => item.reasonCode);
  requireCatalog(
    audit.counts?.expiredItems === (excludedCounts.EXPIRED ?? 0),
    'audit 만료 집계가 다릅니다.',
  );
  requireCatalog(
    audit.counts?.careerOnlyExcluded === (excludedCounts.CAREER_ONLY ?? 0),
    'audit 경력직 제외 집계가 다릅니다.',
  );
  requireCatalog(
    audit.counts?.nonItExcluded === (excludedCounts.NON_IT ?? 0),
    'audit 비IT 제외 집계가 다릅니다.',
  );
  requireCatalog(
    audit.counts?.duplicateItems === (excludedCounts.DUPLICATE ?? 0),
    'audit 중복 제외 집계가 다릅니다.',
  );

  assertCountMap(
    countBy(active.items, (item) => item.sourceName),
    audit.sourceCounts,
    'audit.sourceCounts',
  );
  assertCountMap(
    countBy(active.items, (item) => item.category),
    audit.activeCategoryCounts,
    'audit.activeCategoryCounts',
  );
  assertCountMap(
    countBy(active.items, (item) => item.careerScope),
    audit.activeCareerScopeCounts,
    'audit.activeCareerScopeCounts',
  );
  assertCountMap(
    countBy(active.items, (item) => item.employmentType),
    audit.activeEmploymentTypeCounts,
    'audit.activeEmploymentTypeCounts',
  );

  const requiredValidationFlags = [
    'jsonParseable',
    'sourceCountMatches',
    'manualOverrideAuditTrailComplete',
  ];
  requireCatalog(
    requiredValidationFlags.every((field) => audit.validation?.[field] === true),
    'audit 필수 검증 플래그가 완료되지 않았습니다.',
  );
  const zeroValidationFields = [
    'duplicateCanonicalUrls',
    'duplicateCrossSiteFingerprints',
    'expiredItemsInActiveJson',
    'careerOnlyItemsInActiveJson',
    'securityOrQualityItemsInActiveJson',
    'itemsWithoutSecondPassVerification',
    'itemsWithCopiedOldVerificationTime',
    'rollingWithoutExplicitEvidence',
    'activeWithoutApplicationEvidence',
  ];
  requireCatalog(
    zeroValidationFields.every((field) => audit.validation?.[field] === 0),
    'audit 무결성 검증에 미해결 항목이 있습니다.',
  );

  requireCatalog(
    audit.manualReviewOverride?.applied === true,
    '수동 확인 이력이 적용되지 않았습니다.',
  );
  requireCatalog(
    audit.manualReviewOverride?.decision === 'ALL_NEEDS_REVIEW_RECLASSIFIED_TO_ACTIVE',
    '수동 확인 결정이 예상 값과 다릅니다.',
  );
  const manualOverrideCount = audit.manualReviewOverride?.itemCount;
  requireCatalog(manualOverrideCount === 28, '수동 확인 항목은 정확히 28건이어야 합니다.');
  requireCatalog(
    audit.validation?.userManualConfirmationOverrideCount === manualOverrideCount &&
      audit.validation?.operationalActiveItemsAcceptedByUserManualReview === manualOverrideCount &&
      Array.isArray(audit.manualReclassificationItems) &&
      audit.manualReclassificationItems.length === manualOverrideCount,
    '수동 확인 감사 이력의 건수가 일치하지 않습니다.',
  );

  return {
    asOfDate: audit.asOfDate,
    completionStatus: audit.completionStatus,
    manualOverrideCount,
  };
}

export function generateReplacementSql({
  activeSource,
  uncertainSource,
  excludedSource,
  auditSource,
}) {
  const active = JSON.parse(activeSource);
  const uncertain = JSON.parse(uncertainSource);
  const excluded = JSON.parse(excludedSource);
  const audit = JSON.parse(auditSource);
  const validation = validateCatalogs(active, uncertain, excluded);
  const auditValidation = validateAudit(audit, validation, active, excluded);
  const combinedChecksum = hash(JSON.stringify([active, uncertain, excluded, audit]));
  const appliedAt = new Date(audit.secondPassVerificationFinishedAt).toISOString();
  const statements = [
    "DELETE FROM collection_items WHERE item_type = 'JOB_POSTING';",
    "DELETE FROM notifications WHERE type = 'JOB_DEADLINE';",
    "DELETE FROM import_previews WHERE kind = 'jobs';",
    'DELETE FROM job_source_snapshot_items;',
    'DELETE FROM job_source_snapshots;',
    "DELETE FROM workspace_search WHERE kind = 'jobs';",
    'DELETE FROM job_tech_stacks;',
    'DELETE FROM saved_jobs;',
    'DELETE FROM jobs;',
    "DELETE FROM import_batches WHERE kind = 'jobs';",
  ];

  for (const item of validation.included) {
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
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES (${values.map(quote).join(', ')});`);
  }

  statements.push(
    'DELETE FROM job_tech_stacks;',
    `INSERT OR IGNORE INTO job_tech_stacks (job_id, name, created_at)
SELECT jobs.id, trim(CAST(json_each.value AS text)), jobs.updated_at
FROM jobs, json_each(jobs.tech_stack)
WHERE json_valid(jobs.tech_stack)
  AND length(trim(CAST(json_each.value AS text))) BETWEEN 1 AND 50;`,
    "DELETE FROM workspace_search WHERE kind = 'jobs';",
    `INSERT INTO workspace_search (kind, entity_id, owner_id, title, body)
SELECT 'jobs', id, '', company_name || ' ' || title,
       category || ' ' || region || ' ' || summary || ' ' || tech_stack
FROM jobs
WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN');`,
  );

  const result = {
    ...validation.counts,
    excludedOverlapUrls: validation.overlapUrls.length,
    auditAsOfDate: auditValidation.asOfDate,
    auditCompletionStatus: auditValidation.completionStatus,
    manualOverrideCount: auditValidation.manualOverrideCount,
    policy: 'replace-all; active/deadline-unknown visible; needs-review hidden; excluded omitted',
  };
  statements.push(`INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260814-v2', 'jobs', ${quote(combinedChecksum)}, 'COMMITTED',
   ${validation.counts.stored + validation.counts.excluded}, ${validation.counts.excluded},
   ${quote(JSON.stringify(result))}, ${quote(appliedAt)}, ${quote(appliedAt)});`);
  statements.push(`INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0020_replace_job_catalog_20260814_verified', ${quote(`sha256:${combinedChecksum}`)}, ${quote(appliedAt)});`);
  statements.push('PRAGMA optimize;');

  return {
    sql: `${statements.join(statementBreak)}\n`,
    checksum: combinedChecksum,
    ...validation,
  };
}

export async function generateJobReplacement(paths = catalogPaths) {
  const [activeSource, uncertainSource, excludedSource, auditSource] = await Promise.all([
    readFile(paths.active, 'utf8'),
    readFile(paths.uncertain, 'utf8'),
    readFile(paths.excluded, 'utf8'),
    readFile(paths.audit, 'utf8'),
  ]);
  const result = generateReplacementSql({
    activeSource,
    uncertainSource,
    excludedSource,
    auditSource,
  });
  await writeFile(paths.migration, result.sql, 'utf8');
  return result;
}

const invokedPath = argv[1] ? resolve(argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await generateJobReplacement();
  stdout.write(
    `Generated ${catalogPaths.migration}: ${result.counts.stored} stored, ${result.counts.visible} visible, ${result.counts.excluded} excluded\n`,
  );
}
