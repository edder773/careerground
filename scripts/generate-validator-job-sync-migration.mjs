import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { canonicalJobUrl } from './generate-job-refresh-migration.mjs';

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
const allowedStatuses = new Set([
  'ACTIVE',
  'DEADLINE_UNKNOWN',
  'NEEDS_REVIEW',
  'EXPIRED',
  'REMOVED',
]);
const mutableFields = new Set([
  'deadline_at',
  'rolling',
  'summary',
  'status',
  'last_verified_at',
  'updated_at',
]);

function requireSync(condition, message) {
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

function whereValue(field, value) {
  return value === null || value === undefined ? `${field} IS NULL` : `${field} = ${quote(value)}`;
}

function assertText(value, field, { min = 1, max } = {}) {
  requireSync(typeof value === 'string', `${field} must be a string.`);
  const length = value.trim().length;
  requireSync(length >= min, `${field} cannot be empty.`);
  if (max !== undefined) requireSync(length <= max, `${field} is too long.`);
}

function assertTimestamp(value, field, optional = false) {
  if (optional && (value === null || value === undefined || value === '')) return;
  assertText(value, field);
  requireSync(
    /(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && !Number.isNaN(Date.parse(value)),
    `${field} must be an ISO timestamp with an offset.`,
  );
}

function seoulDate(value) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function countByStatus(items) {
  return Object.fromEntries(
    [
      ...items.reduce((counts, item) => {
        counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
        return counts;
      }, new Map()),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function equalCountMap(actual, expected) {
  const normalize = (value) =>
    Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected));
}

function validateTechStack(value, field) {
  assertText(value, field, { min: 2 });
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${field} must be a JSON array string.`);
  }
  requireSync(Array.isArray(parsed), `${field} must be a JSON array string.`);
  requireSync(parsed.length <= 30, `${field} cannot contain more than 30 entries.`);
  parsed.forEach((entry, index) => assertText(entry, `${field}[${index}]`, { max: 50 }));
  return JSON.stringify(parsed);
}

function validateRow(row, location) {
  requireSync(row && typeof row === 'object', `${location} must be an object.`);
  const sourceUrl = canonicalJobUrl(row.source_url);
  requireSync(
    row.id === `job-${hash(sourceUrl).slice(0, 24)}`,
    `${location}.id does not match canonical source_url.`,
  );
  assertText(row.company_name, `${location}.company_name`, { max: 160 });
  requireSync(allowedCompanySizes.has(row.company_size), `${location}.company_size is invalid.`);
  if (row.company_size_evidence !== null && row.company_size_evidence !== undefined) {
    assertText(row.company_size_evidence, `${location}.company_size_evidence`, {
      min: 0,
      max: 500,
    });
  }
  assertText(row.source_name, `${location}.source_name`, { max: 80 });
  if (row.source_posting_id !== null && row.source_posting_id !== undefined) {
    assertText(row.source_posting_id, `${location}.source_posting_id`, { min: 0, max: 200 });
  }
  assertText(row.title, `${location}.title`, { max: 240 });
  assertText(row.category, `${location}.category`, { max: 80 });
  requireSync(
    allowedCareerScopes.has(row.career_scope),
    `${location}.career_scope must be entry-level eligible.`,
  );
  assertText(row.career_evidence, `${location}.career_evidence`, { max: 500 });
  assertText(row.employment_type, `${location}.employment_type`, { max: 80 });
  assertText(row.region, `${location}.region`, { max: 160 });
  requireSync(row.remote === 0 || row.remote === 1, `${location}.remote must be 0 or 1.`);
  const techStack = validateTechStack(row.tech_stack, `${location}.tech_stack`);
  assertTimestamp(row.published_at, `${location}.published_at`, true);
  assertTimestamp(row.application_start_at, `${location}.application_start_at`, true);
  assertTimestamp(row.deadline_at, `${location}.deadline_at`, true);
  requireSync(row.rolling === 0 || row.rolling === 1, `${location}.rolling must be 0 or 1.`);
  assertText(row.summary, `${location}.summary`, { max: 600 });
  requireSync(allowedStatuses.has(row.status), `${location}.status is invalid.`);
  assertTimestamp(row.collected_at, `${location}.collected_at`);
  assertTimestamp(row.last_verified_at, `${location}.last_verified_at`);
  assertTimestamp(row.created_at, `${location}.created_at`);
  assertTimestamp(row.updated_at, `${location}.updated_at`);
  requireSync(/^[a-f0-9]{64}$/u.test(row.fingerprint), `${location}.fingerprint is invalid.`);
  return { ...row, source_url: sourceUrl, tech_stack: techStack };
}

function uniqueRows(items, label) {
  const ids = items.map((row) => row.id);
  const urls = items.map((row) => row.source_url);
  const fingerprints = items.map((row) => row.fingerprint);
  requireSync(new Set(ids).size === ids.length, `${label} contains duplicate ids.`);
  requireSync(new Set(urls).size === urls.length, `${label} contains duplicate source URLs.`);
  requireSync(
    new Set(fingerprints).size === fingerprints.length,
    `${label} contains duplicate fingerprints.`,
  );
}

function validateBaseline(source) {
  const parsed = JSON.parse(source);
  const rows = Array.isArray(parsed.items) ? parsed.items : parsed.rows;
  requireSync(Array.isArray(rows), 'baseline must contain items or rows.');
  if (parsed.pageChecks) {
    for (const [index, page] of parsed.pageChecks.entries()) {
      requireSync(!page.truncated, `baseline page ${index} is truncated.`);
      requireSync(!page.omitted_columns, `baseline page ${index} omitted columns.`);
      requireSync(!page.omitted_rows, `baseline page ${index} omitted rows.`);
      requireSync(!page.truncated_values, `baseline page ${index} truncated values.`);
    }
  }
  const items = rows.map((row, index) => validateRow(row, `baseline.rows[${index}]`));
  uniqueRows(items, 'baseline');
  return items;
}

function validateLibrary(source, libraryFileName, runAt) {
  const parsed = JSON.parse(source);
  requireSync(parsed.version === '1.0', 'library.version must be 1.0.');
  requireSync(parsed.timezone === 'Asia/Seoul', 'library.timezone must be Asia/Seoul.');
  requireSync(parsed.project === 'careerground-workspace', 'library.project is invalid.');
  requireSync(parsed.databaseBinding === 'DB', 'library.databaseBinding must be DB.');
  requireSync(parsed.table === 'jobs', 'library.table must be jobs.');
  assertTimestamp(parsed.exportedAt, 'library.exportedAt');
  requireSync(Date.parse(parsed.exportedAt) <= Date.parse(runAt), 'library.exportedAt is future.');
  const match = /^careerground-jobs-live-(\d{4}-\d{2}-\d{2})-final\.json$/u.exec(libraryFileName);
  requireSync(match, 'Library filename must match careerground-jobs-live-YYYY-MM-DD-final.json.');
  requireSync(match[1] === seoulDate(parsed.exportedAt), 'Library filename date is invalid.');
  requireSync(Array.isArray(parsed.items), 'library.items must be an array.');
  requireSync(parsed.rowCount === parsed.items.length, 'library.rowCount does not match items.');
  const items = parsed.items.map((row, index) => validateRow(row, `library.items[${index}]`));
  uniqueRows(items, 'library');
  requireSync(
    equalCountMap(countByStatus(items), parsed.statusCounts),
    'library.statusCounts does not match items.',
  );
  return { ...parsed, items };
}

function validateAudit(auditSource, librarySource, library, libraryFileName) {
  const audit = JSON.parse(auditSource);
  requireSync(audit.version === '1.0', 'audit.version must be 1.0.');
  requireSync(audit.artifactType === 'CAREERGROUND_MERGE_AUDIT', 'audit type is invalid.');
  requireSync(audit.timezone === 'Asia/Seoul', 'audit timezone is invalid.');
  requireSync(audit.asOfDate === seoulDate(library.exportedAt), 'audit date is invalid.');
  requireSync(
    Array.isArray(audit.blockingErrors) && audit.blockingErrors.length === 0,
    'audit has blocking errors.',
  );
  requireSync(audit.qualityGates?.overall === 'PASS', 'audit overall quality gate did not pass.');
  requireSync(audit.baseline?.hashMatched === true, 'audit baseline hash did not match.');
  requireSync(audit.existingCoverage?.passed === true, 'audit existing coverage did not pass.');
  requireSync(
    audit.crossPartitionDedup?.completed === true,
    'audit cross-partition dedup is incomplete.',
  );
  requireSync(
    Array.isArray(audit.existingFinalRecheckFailed) &&
      audit.existingFinalRecheckFailed.length === 0,
    'audit contains failed existing rechecks.',
  );
  requireSync(audit.finalOutput?.fileName === libraryFileName, 'audit final filename is invalid.');
  requireSync(
    audit.finalOutput?.rowCount === library.rowCount,
    'audit final row count is invalid.',
  );
  requireSync(
    equalCountMap(audit.finalOutput?.statusCounts, library.statusCounts),
    'audit final status counts are invalid.',
  );
  requireSync(
    audit.finalOutput?.sha256 === hash(librarySource),
    'audit final JSON SHA-256 does not match the Library file.',
  );
  requireSync(
    Array.isArray(audit.partitionInputs) &&
      audit.partitionInputs.length === 3 &&
      audit.partitionInputs.every(
        (item) =>
          [1, 2, 3].includes(item.partitionId) &&
          Array.isArray(item.blockingErrors) &&
          item.blockingErrors.length === 0 &&
          String(item.qualityGates?.overall ?? 'PASS').startsWith('PASS'),
      ),
    'audit partition gate did not pass.',
  );
  return audit;
}

function validateVerificationTime(row, libraryExportedAt, precisionToleranceMs) {
  requireSync(
    seoulDate(row.last_verified_at) === seoulDate(libraryExportedAt),
    `${row.id}.last_verified_at must be from the library export date.`,
  );
  const difference = Date.parse(row.last_verified_at) - Date.parse(libraryExportedAt);
  const sameSerializedSecond =
    Math.floor(Date.parse(row.last_verified_at) / 1000) ===
    Math.floor(Date.parse(libraryExportedAt) / 1000);
  requireSync(
    difference <= 0 || (sameSerializedSecond && difference <= precisionToleranceMs),
    `${row.id}.last_verified_at exceeds the export precision tolerance.`,
  );
  return difference > 0;
}

function confirmedAuditEntry(entry, location) {
  requireSync(entry?.finalRecheckStatus === 'CONFIRMED', `${location} is not confirmed.`);
  requireSync(
    Array.isArray(entry.evidence) && entry.evidence.length > 0,
    `${location} has no evidence.`,
  );
}

function planExistingUpdates({ baselineItems, libraryItems, audit }) {
  const baselineById = new Map(baselineItems.map((row) => [row.id, row]));
  const libraryById = new Map(libraryItems.map((row) => [row.id, row]));
  const updates = new Map();
  const auditRowsNotLive = [];

  function target(entry) {
    confirmedAuditEntry(entry, `audit update ${entry?.id ?? 'unknown'}`);
    const finalRow = libraryById.get(entry.id);
    requireSync(finalRow, `audit update ${entry.id} is missing from final JSON.`);
    const liveRow = baselineById.get(entry.id);
    if (!liveRow) {
      auditRowsNotLive.push(entry.id);
      return null;
    }
    requireSync(
      liveRow.source_url === finalRow.source_url,
      `audit update ${entry.id} source URL does not match live DB.`,
    );
    let update = updates.get(entry.id);
    if (!update) {
      update = {
        id: entry.id,
        company_name: finalRow.company_name,
        title: finalRow.title,
        source_url: finalRow.source_url,
        before: {},
        after: {},
        evidence: [],
        auditDecisions: [],
      };
      updates.set(entry.id, update);
    }
    update.evidence.push(...entry.evidence);
    update.auditDecisions.push(entry.decision);
    return { liveRow, finalRow, update };
  }

  for (const entry of audit.existingStatusChanges ?? []) {
    const resolved = target(entry);
    if (!resolved) continue;
    const { liveRow, finalRow, update } = resolved;
    requireSync(
      liveRow.status === entry.before_status || liveRow.status === entry.after_status,
      `${entry.id} live status precondition failed.`,
    );
    requireSync(
      finalRow.status === entry.after_status,
      `${entry.id} final status is not audit-approved.`,
    );
    requireSync(
      Array.isArray(entry.changed_fields) && entry.changed_fields.length > 0,
      `${entry.id} has no changed fields.`,
    );
    for (const field of entry.changed_fields) {
      requireSync(
        mutableFields.has(field),
        `${entry.id} tries to update forbidden field ${field}.`,
      );
      if (liveRow[field] === finalRow[field]) continue;
      update.before[field] = liveRow[field];
      update.after[field] = finalRow[field];
    }
  }

  for (const entry of audit.existingOtherFieldChanges ?? []) {
    const resolved = target(entry);
    if (!resolved) continue;
    const { liveRow, finalRow, update } = resolved;
    requireSync(entry.changes && typeof entry.changes === 'object', `${entry.id} has no changes.`);
    for (const [field, change] of Object.entries(entry.changes)) {
      requireSync(
        mutableFields.has(field),
        `${entry.id} tries to update forbidden field ${field}.`,
      );
      requireSync(
        liveRow[field] === change.before || liveRow[field] === change.after,
        `${entry.id}.${field} live precondition failed.`,
      );
      requireSync(
        finalRow[field] === change.after,
        `${entry.id}.${field} final value is not approved.`,
      );
      if (liveRow[field] === change.after) continue;
      update.before[field] = change.before;
      update.after[field] = change.after;
    }
    for (const field of ['last_verified_at', 'updated_at']) {
      if (liveRow[field] !== finalRow[field]) {
        update.before[field] = liveRow[field];
        update.after[field] = finalRow[field];
      }
    }
  }

  return {
    updates: [...updates.values()].filter((update) => Object.keys(update.after).length > 0),
    auditRowsNotLive: [...new Set(auditRowsNotLive)],
  };
}

export function generateValidatorSyncSql({
  baselineSource,
  librarySource,
  auditSource,
  libraryFileName,
  libraryFileId = null,
  auditFileName,
  auditFileId = null,
  migrationVersion,
  batchId,
  runAt,
  precisionToleranceMs = 999,
}) {
  assertTimestamp(runAt, 'runAt');
  requireSync(
    Number.isInteger(precisionToleranceMs) &&
      precisionToleranceMs >= 0 &&
      precisionToleranceMs <= 999,
    'precisionToleranceMs must be 0..999.',
  );
  const baselineItems = validateBaseline(baselineSource);
  const library = validateLibrary(librarySource, libraryFileName, runAt);
  const audit = validateAudit(auditSource, librarySource, library, libraryFileName);
  requireSync(
    auditFileName === `careerground-merge-audit-${seoulDate(library.exportedAt)}.json`,
    'Audit filename must match careerground-merge-audit-YYYY-MM-DD.json.',
  );
  assertText(migrationVersion, 'migrationVersion');
  assertText(batchId, 'batchId');

  const baselineUrls = new Set(baselineItems.map((row) => row.source_url));
  const baselineIds = new Set(baselineItems.map((row) => row.id));
  const baselineFingerprints = new Set(baselineItems.map((row) => row.fingerprint));
  const existing = [];
  const candidates = [];
  const excluded = [];
  const conflicts = [];
  let precisionToleranceApplied = 0;

  for (const row of library.items) {
    if (baselineUrls.has(row.source_url)) {
      existing.push(row);
      continue;
    }
    if (baselineIds.has(row.id) || baselineFingerprints.has(row.fingerprint)) {
      conflicts.push({
        id: row.id,
        source_url: row.source_url,
        reason: baselineIds.has(row.id) ? 'DUPLICATE_ID' : 'DUPLICATE_FINGERPRINT',
      });
      continue;
    }
    if (row.status !== 'ACTIVE') {
      excluded.push({
        id: row.id,
        company_name: row.company_name,
        title: row.title,
        source_url: row.source_url,
        status: row.status,
        reason: 'NON_ACTIVE_EXCLUDED',
      });
      continue;
    }
    if (
      row.rolling !== 1 &&
      (!row.deadline_at || Date.parse(row.deadline_at) <= Date.parse(runAt))
    ) {
      excluded.push({
        id: row.id,
        company_name: row.company_name,
        title: row.title,
        source_url: row.source_url,
        status: row.status,
        reason: 'STALE_ACTIVE_EXCLUDED',
      });
      continue;
    }
    if (validateVerificationTime(row, library.exportedAt, precisionToleranceMs)) {
      precisionToleranceApplied += 1;
    }
    candidates.push(row);
  }

  requireSync(
    conflicts.length === 0,
    `Validator sync has ${conflicts.length} live id/fingerprint conflict(s): ${conflicts.map((item) => item.source_url).join(', ')}`,
  );
  const { updates, auditRowsNotLive } = planExistingUpdates({
    baselineItems,
    libraryItems: library.items,
    audit,
  });

  const checksum = hash(
    JSON.stringify({
      libraryFileName,
      libraryFileId,
      librarySha256: hash(librarySource),
      auditFileName,
      auditFileId,
      auditSha256: hash(auditSource),
      baselineIds: baselineItems.map((row) => row.id),
      insertedIds: candidates.map((row) => row.id),
      updatedIds: updates.map((row) => row.id),
      runAt,
    }),
  );
  const report = {
    version: '1.0',
    mode: 'VALIDATOR_CONFIRMED_SYNC',
    runAt,
    library: {
      fileName: libraryFileName,
      libraryFileId,
      exportedAt: library.exportedAt,
      sha256: hash(librarySource),
      sourceRows: library.items.length,
    },
    audit: {
      fileName: auditFileName,
      auditFileId,
      runGroupKey: audit.runGroupKey,
      sha256: hash(auditSource),
      qualityGate: audit.qualityGates.overall,
    },
    precisionRule: {
      maxSameSecondSkewMs: precisionToleranceMs,
      appliedRows: precisionToleranceApplied,
      reason:
        'Library exportedAt is serialized to seconds while verifier timestamps retain milliseconds.',
    },
    comparison: {
      baselineRows: baselineItems.length,
      matchedExistingRows: existing.length,
      newSourceRows: candidates.length + excluded.length,
      addedActiveRows: candidates.length,
      excludedNewNonActiveRows: excluded.length,
      excludedStaleActiveRows: excluded.filter((row) => row.reason === 'STALE_ACTIVE_EXCLUDED')
        .length,
      conflictRows: conflicts.length,
      updatedExistingRows: updates.length,
      auditRowsNotLive: auditRowsNotLive.length,
      deletedRows: 0,
      storedRowsAfter: baselineItems.length + candidates.length,
    },
    added: candidates.map(({ id, company_name, title, source_url }) => ({
      id,
      company_name,
      title,
      source_url,
    })),
    updated: updates.map(
      ({ id, company_name, title, source_url, before, after, auditDecisions }) => ({
        id,
        company_name,
        title,
        source_url,
        before,
        after,
        auditDecisions,
      }),
    ),
    excluded,
    auditRowsNotLive,
    conflicts,
  };

  if (candidates.length === 0 && updates.length === 0) {
    return { sql: null, checksum: null, report, candidates, updates, excluded, noChange: true };
  }

  const statements = [];
  for (const update of updates) {
    const fields = Object.keys(update.after).sort();
    statements.push(
      `UPDATE jobs\nSET ${fields.map((field) => `${field} = ${quote(update.after[field])}`).join(', ')}\nWHERE id = ${quote(update.id)}\n  AND source_url = ${quote(update.source_url)}\n  AND ${fields.map((field) => whereValue(field, update.before[field])).join('\n  AND ')};`,
    );
  }
  for (const row of candidates) {
    const values = [
      row.id,
      row.company_name,
      row.company_size,
      row.company_size_evidence,
      row.source_name,
      row.source_posting_id,
      row.source_url,
      row.title,
      row.category,
      row.career_scope,
      row.career_evidence,
      row.employment_type,
      row.region,
      row.remote,
      row.tech_stack,
      row.published_at,
      row.application_start_at,
      row.deadline_at,
      row.rolling,
      row.summary,
      row.status,
      row.fingerprint,
      row.collected_at,
      row.last_verified_at,
      row.created_at,
      row.updated_at,
    ];
    statements.push(
      `INSERT INTO jobs\n  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,\n   source_url, title, category, career_scope, career_evidence, employment_type, region,\n   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,\n   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)\nVALUES (${values.map(quote).join(', ')})\nON CONFLICT(source_url) DO NOTHING;`,
    );
  }
  statements.push(
    `INSERT INTO import_batches\n  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)\nVALUES\n  (${quote(batchId)}, 'jobs', ${quote(checksum)}, 'COMMITTED', ${candidates.length + updates.length}, ${excluded.length},\n   ${quote(JSON.stringify(report.comparison))}, ${quote(runAt)}, ${quote(runAt)})\nON CONFLICT(id) DO NOTHING;`,
  );
  statements.push(
    `INSERT INTO app_schema_migrations (version, checksum, applied_at)\nVALUES (${quote(migrationVersion)}, ${quote(`sha256:${checksum}`)}, ${quote(runAt)})\nON CONFLICT(version) DO NOTHING;`,
  );
  statements.push('PRAGMA optimize;');

  const sql = `${statements.join(statementBreak)}\n`;
  requireSync(!/DELETE\s+FROM\s+jobs/iu.test(sql), 'Generated SQL cannot delete jobs.');
  requireSync(!/saved_jobs/iu.test(sql), 'Generated SQL cannot reference saved_jobs.');
  requireSync(
    !/UPDATE\s+jobs\s+SET(?:(?!WHERE)[\s\S])*\bsource_url\s*=/iu.test(sql),
    'Generated SQL cannot change source_url.',
  );
  return { sql, checksum, report, candidates, updates, excluded, noChange: false };
}

function parseCli(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    requireSync(key?.startsWith('--') && value, `Invalid CLI argument near ${key || 'end'}.`);
    values.set(key.slice(2), value);
  }
  for (const key of [
    'library',
    'library-name',
    'audit',
    'audit-name',
    'baseline',
    'new-active',
    'existing-updates',
    'excluded',
    'report',
    'migration',
    'batch-id',
    'run-at',
  ]) {
    requireSync(values.has(key), `--${key} is required.`);
  }
  const migration = values.get('migration');
  requireSync(/^drizzle\/\d{4}_[a-z0-9_]+\.sql$/u.test(migration), '--migration path is invalid.');
  return {
    library: values.get('library'),
    libraryFileName: values.get('library-name'),
    libraryFileId: values.get('library-file-id') || null,
    audit: values.get('audit'),
    auditFileName: values.get('audit-name'),
    auditFileId: values.get('audit-file-id') || null,
    baseline: values.get('baseline'),
    newActive: values.get('new-active'),
    existingUpdates: values.get('existing-updates'),
    excluded: values.get('excluded'),
    report: values.get('report'),
    migration,
    migrationVersion: basename(migration, '.sql'),
    batchId: values.get('batch-id'),
    runAt: values.get('run-at'),
  };
}

export async function generateValidatorJobSync(paths) {
  const [baselineSource, librarySource, auditSource] = await Promise.all([
    readFile(paths.baseline, 'utf8'),
    readFile(paths.library, 'utf8'),
    readFile(paths.audit, 'utf8'),
  ]);
  const result = generateValidatorSyncSql({
    baselineSource,
    librarySource,
    auditSource,
    libraryFileName: paths.libraryFileName,
    libraryFileId: paths.libraryFileId,
    auditFileName: paths.auditFileName,
    auditFileId: paths.auditFileId,
    migrationVersion: paths.migrationVersion,
    batchId: paths.batchId,
    runAt: paths.runAt,
  });
  const outputs = [
    [
      paths.newActive,
      {
        version: '1.0',
        generatedAt: paths.runAt,
        rowCount: result.candidates.length,
        items: result.candidates,
      },
    ],
    [
      paths.existingUpdates,
      {
        version: '1.0',
        generatedAt: paths.runAt,
        rowCount: result.updates.length,
        items: result.updates,
      },
    ],
    [
      paths.excluded,
      {
        version: '1.0',
        generatedAt: paths.runAt,
        rowCount: result.excluded.length,
        items: result.excluded,
      },
    ],
    [paths.report, result.report],
  ];
  for (const [path, value] of outputs) {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  }
  if (result.sql) await writeFile(paths.migration, result.sql, { encoding: 'utf8', flag: 'wx' });
  return result;
}

const invokedPath = argv[1] ? resolve(argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const paths = parseCli(argv.slice(2));
  const result = await generateValidatorJobSync(paths);
  stdout.write(
    result.noChange
      ? 'No confirmed validator changes; migration was not created.\n'
      : `Generated ${paths.migration}: ${result.candidates.length} inserted, ${result.updates.length} audit-confirmed updated, ${result.excluded.length} non-active excluded, 0 deleted.\n`,
  );
}
