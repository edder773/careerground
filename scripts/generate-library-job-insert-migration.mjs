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

function requireImport(condition, message) {
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

function assertText(value, field, { min = 1, max } = {}) {
  requireImport(typeof value === 'string', `${field} must be a string.`);
  const length = value.trim().length;
  requireImport(length >= min, `${field} cannot be empty.`);
  if (max !== undefined) requireImport(length <= max, `${field} is too long.`);
}

function assertTimestamp(value, field, optional = false) {
  if (optional && (value === null || value === undefined || value === '')) return;
  assertText(value, field);
  requireImport(
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

function parseTechStack(value, field) {
  assertText(value, field, { min: 2 });
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${field} must be a JSON array string.`);
  }
  requireImport(Array.isArray(parsed), `${field} must be a JSON array string.`);
  requireImport(parsed.length <= 30, `${field} cannot contain more than 30 entries.`);
  parsed.forEach((entry, index) => assertText(entry, `${field}[${index}]`, { max: 50 }));
  return JSON.stringify(parsed);
}

function validateRow(row, location) {
  requireImport(row && typeof row === 'object', `${location} must be an object.`);
  const sourceUrl = canonicalJobUrl(row.source_url);
  const expectedId = `job-${hash(sourceUrl).slice(0, 24)}`;
  requireImport(row.id === expectedId, `${location}.id does not match canonical source_url.`);
  assertText(row.company_name, `${location}.company_name`, { max: 160 });
  requireImport(allowedCompanySizes.has(row.company_size), `${location}.company_size is invalid.`);
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
  requireImport(
    allowedCareerScopes.has(row.career_scope),
    `${location}.career_scope must be entry-level eligible.`,
  );
  assertText(row.career_evidence, `${location}.career_evidence`, { max: 500 });
  assertText(row.employment_type, `${location}.employment_type`, { max: 80 });
  assertText(row.region, `${location}.region`, { max: 160 });
  requireImport(row.remote === 0 || row.remote === 1, `${location}.remote must be 0 or 1.`);
  const techStack = parseTechStack(row.tech_stack, `${location}.tech_stack`);
  assertTimestamp(row.published_at, `${location}.published_at`, true);
  assertTimestamp(row.application_start_at, `${location}.application_start_at`, true);
  assertTimestamp(row.deadline_at, `${location}.deadline_at`, true);
  requireImport(row.rolling === 0 || row.rolling === 1, `${location}.rolling must be 0 or 1.`);
  assertText(row.summary, `${location}.summary`, { max: 600 });
  requireImport(allowedStatuses.has(row.status), `${location}.status is invalid.`);
  assertTimestamp(row.collected_at, `${location}.collected_at`);
  assertTimestamp(row.last_verified_at, `${location}.last_verified_at`);
  assertTimestamp(row.created_at, `${location}.created_at`);
  assertTimestamp(row.updated_at, `${location}.updated_at`);
  requireImport(/^[a-f0-9]{64}$/u.test(row.fingerprint), `${location}.fingerprint is invalid.`);
  return { ...row, source_url: sourceUrl, tech_stack: techStack };
}

function validateEnvelope(source, label, { requireStatusCounts = false } = {}) {
  requireImport(source?.version === '1.0', `${label}.version must be 1.0.`);
  requireImport(source.timezone === 'Asia/Seoul', `${label}.timezone must be Asia/Seoul.`);
  requireImport(
    source.project === 'careerground-workspace',
    `${label}.project must be careerground-workspace.`,
  );
  requireImport(source.databaseBinding === 'DB', `${label}.databaseBinding must be DB.`);
  requireImport(source.table === 'jobs', `${label}.table must be jobs.`);
  assertTimestamp(source.exportedAt, `${label}.exportedAt`);
  requireImport(Array.isArray(source.items), `${label}.items must be an array.`);
  requireImport(source.rowCount === source.items.length, `${label}.rowCount does not match items.`);
  const items = source.items.map((row, index) => validateRow(row, `${label}.items[${index}]`));
  const ids = items.map((row) => row.id);
  const urls = items.map((row) => row.source_url);
  const fingerprints = items.map((row) => row.fingerprint);
  requireImport(new Set(ids).size === ids.length, `${label} contains duplicate ids.`);
  requireImport(new Set(urls).size === urls.length, `${label} contains duplicate source URLs.`);
  requireImport(
    new Set(fingerprints).size === fingerprints.length,
    `${label} contains duplicate fingerprints.`,
  );
  if (requireStatusCounts) {
    requireImport(
      equalCountMap(countByStatus(items), source.statusCounts),
      `${label}.statusCounts does not match items.`,
    );
  }
  return { ...source, items };
}

function validateLibraryFilename(libraryFileName, exportedAt) {
  const match = /^careerground-jobs-live-(\d{4}-\d{2}-\d{2})-final\.json$/u.exec(libraryFileName);
  requireImport(match, 'Library filename must match careerground-jobs-live-YYYY-MM-DD-final.json.');
  requireImport(
    match[1] === seoulDate(exportedAt),
    'Library filename date must match exportedAt in Asia/Seoul.',
  );
}

function validateNewActive(row, libraryExportedAt, runAt, location) {
  requireImport(row.status === 'ACTIVE', `${location}.status must be ACTIVE.`);
  requireImport(
    allowedCareerScopes.has(row.career_scope),
    `${location}.career_scope must be entry-level eligible.`,
  );
  requireImport(
    seoulDate(row.last_verified_at) === seoulDate(libraryExportedAt),
    `${location}.last_verified_at must be from the library export date.`,
  );
  requireImport(
    Date.parse(row.last_verified_at) <= Date.parse(libraryExportedAt),
    `${location}.last_verified_at cannot be after library exportedAt.`,
  );
}

export function generateLibraryInsertSql({
  baselineSource,
  librarySource,
  libraryFileName,
  libraryFileId = null,
  migrationVersion,
  batchId,
  runAt,
}) {
  assertTimestamp(runAt, 'runAt');
  const baseline = validateEnvelope(JSON.parse(baselineSource), 'baseline');
  const library = validateEnvelope(JSON.parse(librarySource), 'library', {
    requireStatusCounts: true,
  });
  validateLibraryFilename(libraryFileName, library.exportedAt);
  requireImport(
    Date.parse(library.exportedAt) <= Date.parse(runAt),
    'Library exportedAt cannot be in the future.',
  );
  assertText(migrationVersion, 'migrationVersion');
  assertText(batchId, 'batchId');

  const baselineUrls = new Set(baseline.items.map((row) => row.source_url));
  const baselineIds = new Set(baseline.items.map((row) => row.id));
  const baselineFingerprints = new Set(baseline.items.map((row) => row.fingerprint));
  const existing = [];
  const candidates = [];
  const excluded = [];
  const conflicts = [];

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
    if (row.rolling !== 1 && (!row.deadline_at || Date.parse(row.deadline_at) <= Date.parse(runAt))) {
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
    validateNewActive(row, library.exportedAt, runAt, `newActive.${row.id}`);
    candidates.push(row);
  }

  requireImport(
    conflicts.length === 0,
    `Library import has ${conflicts.length} baseline id/fingerprint conflict(s): ${conflicts
      .map((item) => item.source_url)
      .join(', ')}`,
  );

  const checksum = hash(
    JSON.stringify({
      libraryFileName,
      libraryFileId,
      libraryExportedAt: library.exportedAt,
      baselineIds: baseline.items.map((row) => row.id),
      insertedIds: candidates.map((row) => row.id),
      runAt,
    }),
  );
  const report = {
    version: '1.0',
    mode: 'LIBRARY_ACTIVE_INSERT_ONLY',
    runAt,
    library: {
      fileName: libraryFileName,
      libraryFileId,
      exportedAt: library.exportedAt,
      sourceRows: library.items.length,
    },
    comparison: {
      baselineRows: baseline.items.length,
      matchedExistingRows: existing.length,
      newSourceRows: candidates.length + excluded.length,
      addedActiveRows: candidates.length,
      excludedNewNonActiveRows: excluded.length,
      excludedStaleActiveRows: excluded.filter(
        (row) => row.reason === 'STALE_ACTIVE_EXCLUDED',
      ).length,
      conflictRows: conflicts.length,
      updatedExistingRows: 0,
      deletedRows: 0,
      storedRowsAfter: baseline.items.length + candidates.length,
    },
    added: candidates.map((row) => ({
      id: row.id,
      company_name: row.company_name,
      title: row.title,
      source_url: row.source_url,
    })),
    excluded,
    conflicts,
  };

  if (candidates.length === 0) {
    return { sql: null, checksum: null, report, candidates, excluded, noChange: true };
  }

  const statements = candidates.map((row) => {
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
    return `INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES (${values.map(quote).join(', ')})
ON CONFLICT(source_url) DO NOTHING;`;
  });

  statements.push(`INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  (${quote(batchId)}, 'jobs', ${quote(checksum)}, 'COMMITTED', ${candidates.length}, 0,
   ${quote(JSON.stringify(report.comparison))}, ${quote(runAt)}, ${quote(runAt)})
ON CONFLICT(id) DO NOTHING;`);
  statements.push(`INSERT INTO app_schema_migrations (version, checksum, applied_at)
VALUES (${quote(migrationVersion)}, ${quote(`sha256:${checksum}`)}, ${quote(runAt)})
ON CONFLICT(version) DO NOTHING;`);
  statements.push('PRAGMA optimize;');

  const sql = `${statements.join(statementBreak)}\n`;
  requireImport(!/UPDATE\s+jobs/iu.test(sql), 'Generated SQL cannot update jobs.');
  requireImport(!/DELETE\s+FROM\s+jobs/iu.test(sql), 'Generated SQL cannot delete jobs.');
  requireImport(!/saved_jobs/iu.test(sql), 'Generated SQL cannot reference saved_jobs.');
  return { sql, checksum, report, candidates, excluded, noChange: false };
}

function parseCli(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    requireImport(key?.startsWith('--') && value, `Invalid CLI argument near ${key || 'end'}.`);
    values.set(key.slice(2), value);
  }
  for (const key of [
    'library',
    'library-name',
    'baseline',
    'new-active',
    'excluded',
    'report',
    'migration',
    'batch-id',
    'run-at',
  ]) {
    requireImport(values.has(key), `--${key} is required.`);
  }
  const migration = values.get('migration');
  requireImport(
    /^drizzle\/\d{4}_[a-z0-9_]+\.sql$/u.test(migration),
    '--migration must be a new numbered drizzle SQL path.',
  );
  return {
    library: values.get('library'),
    libraryFileName: values.get('library-name'),
    libraryFileId: values.get('library-file-id') || null,
    baseline: values.get('baseline'),
    newActive: values.get('new-active'),
    excluded: values.get('excluded'),
    report: values.get('report'),
    migration,
    migrationVersion: basename(migration, '.sql'),
    batchId: values.get('batch-id'),
    runAt: values.get('run-at'),
  };
}

export async function generateLibraryJobInsert(paths) {
  const [baselineSource, librarySource] = await Promise.all([
    readFile(paths.baseline, 'utf8'),
    readFile(paths.library, 'utf8'),
  ]);
  const result = generateLibraryInsertSql({
    baselineSource,
    librarySource,
    libraryFileName: paths.libraryFileName,
    libraryFileId: paths.libraryFileId,
    migrationVersion: paths.migrationVersion,
    batchId: paths.batchId,
    runAt: paths.runAt,
  });
  await writeFile(
    paths.newActive,
    `${JSON.stringify(
      {
        version: '1.0',
        mode: 'LIBRARY_ACTIVE_INSERT_ONLY',
        generatedAt: paths.runAt,
        rowCount: result.candidates.length,
        items: result.candidates,
      },
      null,
      2,
    )}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  await writeFile(
    paths.excluded,
    `${JSON.stringify(
      {
        version: '1.0',
        generatedAt: paths.runAt,
        rowCount: result.excluded.length,
        items: result.excluded,
      },
      null,
      2,
    )}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  await writeFile(paths.report, `${JSON.stringify(result.report, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  if (result.sql) {
    await writeFile(paths.migration, result.sql, { encoding: 'utf8', flag: 'wx' });
  }
  return result;
}

const invokedPath = argv[1] ? resolve(argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const paths = parseCli(argv.slice(2));
  const result = await generateLibraryJobInsert(paths);
  stdout.write(
    result.noChange
      ? 'No new ACTIVE library jobs; migration was not created.\n'
      : `Generated ${paths.migration}: ${result.candidates.length} inserted, ${result.excluded.length} non-active excluded, 0 updated, 0 deleted.\n`,
  );
}
