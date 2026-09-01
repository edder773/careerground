import { all, first, type D1Database, type D1PreparedStatement } from './d1.js';
import { RouteError } from './d1-api-contract.js';
import { validateDiscoveryPublishRequest } from './d1-jobs-v5-discovery-contract.js';
import { duplicateJobReason, jobCompanyKey, type ComparableJob } from './job-dedup.js';

const V5_WORKFLOW_ID = 'CG-JOBS-PROD-V5';

export type V5Manifest = {
  schemaVersion: string;
  workflowId: string;
  runId: string;
  runGroupKey: string;
  targetAsOfDate: string;
  attempt: number;
  mode: 'DRY_RUN' | 'RESUME' | 'PUBLISH';
  status: string;
  previousSuccessfulRunId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  validatedAt: string | null;
  publishedAt: string | null;
  manifestChecksum: string;
  counts: { new: number; changed: number; ended: number; excluded: number; active: number };
  db: { idempotencyKey: string; status: string; sourceChecksum?: string };
};

export type V5VerifiedResult = {
  status: 'VERIFIED';
  runId: string;
  manifestChecksum: string;
  newJobs: Array<Record<string, unknown>>;
  updates: V5PlannedChange[];
  ended: V5PlannedChange[];
};

type V5PlannedChange = {
  id: string;
  sourceUrl: string;
  canonicalJobKey: string;
  changes: Record<string, { before: unknown; after: unknown }>;
};

type WorkflowRunRow = { status: string; manifestChecksum: string | null };

const MUTABLE_COLUMNS: Record<string, string> = {
  status: 'status',
  deadlineAt: 'deadline_at',
  rolling: 'rolling',
  summary: 'summary',
  lastVerifiedAt: 'last_verified_at',
  updatedAt: 'updated_at',
};

const UNORDERED_ARRAY_KEYS = new Set(['sources', 'techStack', 'tags', 'excludedReasons']);

function canonicalValue(value: unknown, parentKey = ''): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => canonicalValue(entry));
    if (UNORDERED_ARRAY_KEYS.has(parentKey)) {
      normalized.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    } else if (parentKey === 'items') {
      normalized.sort((left, right) =>
        String((left as Record<string, unknown>)?.canonicalJobKey || '').localeCompare(
          String((right as Record<string, unknown>)?.canonicalJobKey || ''),
        ),
      );
    }
    return normalized;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalValue(entry, key)]),
    );
  }
  return value;
}

export async function v5ManifestChecksum(manifest: V5Manifest) {
  const value: Record<string, unknown> = { ...manifest };
  delete value.manifestChecksum;
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalValue(value)));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function requireManifestChecksum(manifest: V5Manifest) {
  if ((await v5ManifestChecksum(manifest)) !== manifest.manifestChecksum) {
    throw new Error('Manifest checksum mismatch.');
  }
}

function serialize(value: unknown) {
  return JSON.stringify(value);
}

function bool(value: unknown) {
  return value === true || value === 1 ? 1 : 0;
}

function requiredText(job: Record<string, unknown>, field: string) {
  const value = String(job[field] ?? '').trim();
  if (!value) throw new Error(`V5 staged job is missing ${field}.`);
  return value;
}

export async function recordWorkflowRun(db: D1Database, manifest: V5Manifest) {
  await db.batch([
    db
      .prepare(
        `INSERT INTO workflow_runs
          (run_id, schema_version, workflow_id, run_group_key, target_as_of_date, attempt,
           mode, status, previous_successful_run_id, error_code, error_message, manifest,
           manifest_checksum, started_at, completed_at, validated_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(run_id) DO UPDATE SET
           status = excluded.status,
           error_code = excluded.error_code,
           error_message = excluded.error_message,
           manifest = excluded.manifest,
           manifest_checksum = excluded.manifest_checksum,
           completed_at = excluded.completed_at,
           validated_at = excluded.validated_at,
           published_at = excluded.published_at
         WHERE workflow_runs.status <> 'PUBLISHED'`,
      )
      .bind(
        manifest.runId,
        manifest.schemaVersion,
        manifest.workflowId,
        manifest.runGroupKey,
        manifest.targetAsOfDate,
        manifest.attempt,
        manifest.mode,
        manifest.status,
        manifest.previousSuccessfulRunId,
        manifest.errorCode,
        manifest.errorMessage,
        serialize(manifest),
        manifest.manifestChecksum,
        manifest.startedAt,
        manifest.completedAt,
        manifest.validatedAt,
        manifest.publishedAt,
      ),
    db
      .prepare(
        `INSERT INTO workflow_pointers (workflow_id, pointer_name, run_id, updated_at)
         VALUES (?, 'current', ?, ?)
         ON CONFLICT(workflow_id, pointer_name) DO UPDATE SET
           run_id = excluded.run_id, updated_at = excluded.updated_at`,
      )
      .bind(manifest.workflowId, manifest.runId, manifest.validatedAt || manifest.startedAt),
  ]);
}

export async function stageVerifiedRun(
  db: D1Database,
  manifest: V5Manifest,
  verified: V5VerifiedResult,
) {
  if (manifest.status !== 'VERIFIED' || verified.status !== 'VERIFIED') {
    throw new Error('Only VERIFIED results can be staged.');
  }
  await requireManifestChecksum(manifest);
  if (
    verified.runId !== manifest.runId ||
    verified.manifestChecksum !== manifest.manifestChecksum
  ) {
    throw new Error('Verified result does not match its manifest.');
  }
  const existing = await first<WorkflowRunRow>(
    db,
    `SELECT status, manifest_checksum AS manifestChecksum FROM workflow_runs WHERE run_id = ?`,
    manifest.runId,
  );
  if (existing && existing.manifestChecksum !== manifest.manifestChecksum) {
    throw new Error('A different manifest is already recorded for this runId.');
  }
  if (existing?.status === 'PUBLISHED') return { staged: 0, alreadyPublished: true };
  if (existing && existing.status !== 'VERIFIED') {
    throw new Error('Staging requires a VERIFIED workflow run.');
  }
  if (!existing) await recordWorkflowRun(db, manifest);
  const statements: D1PreparedStatement[] = [];
  const timestamp = manifest.validatedAt || new Date().toISOString();
  for (const job of verified.newJobs) {
    statements.push(
      db
        .prepare(
          `INSERT INTO workflow_staged_jobs
            (run_id, job_id, canonical_job_key, operation, payload, expected_before, evidence, created_at)
           VALUES (?, ?, ?, 'INSERT', ?, NULL, ?, ?)
           ON CONFLICT(run_id, job_id, operation) DO UPDATE SET
             payload = excluded.payload, evidence = excluded.evidence`,
        )
        .bind(
          manifest.runId,
          requiredText(job, 'id'),
          requiredText(job, 'canonicalJobKey'),
          serialize(job),
          serialize({ careerEvidence: job.careerEvidence, lastVerifiedAt: job.lastVerifiedAt }),
          timestamp,
        ),
    );
  }
  for (const [operation, entries] of [
    ['UPDATE', verified.updates],
    ['END', verified.ended],
  ] as const) {
    for (const entry of entries) {
      statements.push(
        db
          .prepare(
            `INSERT INTO workflow_staged_jobs
              (run_id, job_id, canonical_job_key, operation, payload, expected_before, evidence, created_at)
             VALUES (?, ?, ?, ?, ?, ?, '{}', ?)
             ON CONFLICT(run_id, job_id, operation) DO UPDATE SET
               payload = excluded.payload, expected_before = excluded.expected_before`,
          )
          .bind(
            manifest.runId,
            entry.id,
            entry.canonicalJobKey,
            operation,
            serialize(
              Object.fromEntries(
                Object.entries(entry.changes).map(([key, value]) => [key, value.after]),
              ),
            ),
            serialize(
              Object.fromEntries(
                Object.entries(entry.changes).map(([key, value]) => [key, value.before]),
              ),
            ),
            timestamp,
          ),
      );
    }
  }
  if (statements.length) await db.batch(statements);
  return { staged: statements.length };
}

async function verifyExpectedBefore(db: D1Database, runId: string) {
  const staged = await all<{
    jobId: string;
    operation: string;
    expectedBefore: string | null;
  }>(
    db,
    `SELECT job_id AS jobId, operation, expected_before AS expectedBefore
       FROM workflow_staged_jobs WHERE run_id = ? AND operation IN ('UPDATE', 'END')`,
    runId,
  );
  for (const entry of staged) {
    const expected = JSON.parse(entry.expectedBefore || '{}') as Record<string, unknown>;
    const columns = Object.keys(expected);
    if (columns.some((field) => !MUTABLE_COLUMNS[field])) {
      throw new Error('Staged update contains a forbidden field.');
    }
    const select = columns.map((field) => `${MUTABLE_COLUMNS[field]} AS ${field}`).join(', ');
    const row = await first<Record<string, unknown>>(
      db,
      `SELECT ${select || 'id'} FROM jobs WHERE id = ?`,
      entry.jobId,
    );
    if (!row || columns.some((field) => (row[field] ?? null) !== (expected[field] ?? null))) {
      throw new Error(`Staged before-image no longer matches job ${entry.jobId}.`);
    }
  }
}

function insertJobStatement(db: D1Database, job: Record<string, unknown>) {
  const timestamp = String(job.updatedAt || job.lastVerifiedAt || new Date().toISOString());
  return db
    .prepare(
      `INSERT INTO jobs
        (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
         source_url, title, category, career_scope, career_evidence, employment_type, region,
         remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
         status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      requiredText(job, 'id'),
      requiredText(job, 'companyName'),
      String(job.companySize || 'UNCLASSIFIED'),
      job.companySizeEvidence ?? null,
      requiredText(job, 'sourceName'),
      job.sourcePostingId ?? null,
      requiredText(job, 'sourceUrl'),
      requiredText(job, 'title'),
      requiredText(job, 'category'),
      requiredText(job, 'careerScope'),
      requiredText(job, 'careerEvidence'),
      String(job.employmentType || 'FULL_TIME'),
      String(job.region || '대한민국'),
      bool(job.remote),
      serialize(Array.isArray(job.techStack) ? job.techStack : []),
      job.publishedAt ?? null,
      job.applicationStartAt ?? null,
      job.deadlineAt ?? null,
      bool(job.rolling),
      String(job.summary || job.title || ''),
      requiredText(job, 'status'),
      requiredText(job, 'fingerprint'),
      job.collectedAt ?? timestamp,
      requiredText(job, 'lastVerifiedAt'),
      String(job.createdAt || timestamp),
      timestamp,
    );
}

function updateJobStatement(
  db: D1Database,
  entry: { jobId: string; payload: string; expectedBefore: string | null },
) {
  const payload = JSON.parse(entry.payload) as Record<string, unknown>;
  const before = JSON.parse(entry.expectedBefore || '{}') as Record<string, unknown>;
  const fields = Object.keys(payload);
  if (!fields.length || fields.some((field) => !MUTABLE_COLUMNS[field])) {
    throw new Error('Staged update contains no fields or a forbidden field.');
  }
  const assignments = fields.map((field) => `${MUTABLE_COLUMNS[field]} = ?`).join(', ');
  const conditions = Object.keys(before).map((field) => `${MUTABLE_COLUMNS[field]} IS ?`);
  return db
    .prepare(`UPDATE jobs SET ${assignments} WHERE id = ? AND ${conditions.join(' AND ')}`)
    .bind(
      ...fields.map((field) => (field === 'rolling' ? bool(payload[field]) : payload[field])),
      entry.jobId,
      ...Object.keys(before).map((field) =>
        field === 'rolling' ? bool(before[field]) : before[field],
      ),
    );
}

export async function publishVerifiedRun(db: D1Database, manifest: V5Manifest) {
  if (manifest.mode !== 'PUBLISH') throw new Error('Publishing requires PUBLISH mode.');
  await requireManifestChecksum(manifest);
  const priorPublication = await first<{ runId: string; manifestChecksum: string }>(
    db,
    `SELECT run_id AS runId, manifest_checksum AS manifestChecksum
       FROM workflow_publications WHERE idempotency_key = ?`,
    manifest.db.idempotencyKey,
  );
  if (priorPublication) {
    if (
      priorPublication.runId !== manifest.runId ||
      priorPublication.manifestChecksum !== manifest.manifestChecksum
    )
      throw new Error('Idempotency key belongs to a different publication.');
    return { status: 'ALREADY_PUBLISHED' as const, runId: manifest.runId };
  }
  const run = await first<WorkflowRunRow>(
    db,
    `SELECT status, manifest_checksum AS manifestChecksum FROM workflow_runs WHERE run_id = ?`,
    manifest.runId,
  );
  if (!run || run.status !== 'VERIFIED' || run.manifestChecksum !== manifest.manifestChecksum)
    throw new Error('Only the matching VERIFIED database run can be published.');
  await verifyExpectedBefore(db, manifest.runId);
  const staged = await all<{
    jobId: string;
    operation: string;
    payload: string;
    expectedBefore: string | null;
  }>(
    db,
    `SELECT job_id AS jobId, operation, payload, expected_before AS expectedBefore
       FROM workflow_staged_jobs WHERE run_id = ? ORDER BY operation, job_id`,
    manifest.runId,
  );
  const statements: D1PreparedStatement[] = [];
  statements.push(
    db
      .prepare(
        `INSERT INTO workflow_publish_assertions (run_id, ok, created_at)
         SELECT ?,
                CASE WHEN NOT EXISTS (
                  SELECT 1
                    FROM workflow_staged_jobs s
                    LEFT JOIN jobs j ON j.id = s.job_id
                   WHERE s.run_id = ? AND s.operation IN ('UPDATE', 'END') AND (
                     j.id IS NULL OR
                     (json_type(s.expected_before, '$.status') IS NOT NULL AND j.status IS NOT json_extract(s.expected_before, '$.status')) OR
                     (json_type(s.expected_before, '$.deadlineAt') IS NOT NULL AND j.deadline_at IS NOT json_extract(s.expected_before, '$.deadlineAt')) OR
                     (json_type(s.expected_before, '$.rolling') IS NOT NULL AND j.rolling IS NOT json_extract(s.expected_before, '$.rolling')) OR
                     (json_type(s.expected_before, '$.summary') IS NOT NULL AND j.summary IS NOT json_extract(s.expected_before, '$.summary')) OR
                     (json_type(s.expected_before, '$.lastVerifiedAt') IS NOT NULL AND j.last_verified_at IS NOT json_extract(s.expected_before, '$.lastVerifiedAt')) OR
                     (json_type(s.expected_before, '$.updatedAt') IS NOT NULL AND j.updated_at IS NOT json_extract(s.expected_before, '$.updatedAt'))
                   )
                ) THEN 1 ELSE 0 END,
                ?`,
      )
      .bind(manifest.runId, manifest.runId, new Date().toISOString()),
  );
  for (const entry of staged) {
    if (entry.operation === 'INSERT')
      statements.push(insertJobStatement(db, JSON.parse(entry.payload)));
    else statements.push(updateJobStatement(db, entry));
  }
  const publishedAt = new Date().toISOString();
  statements.push(
    db
      .prepare(
        `INSERT INTO import_batches
          (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'jobs-v5', ?, 'COMMITTED', ?, ?, ?, ?, ?)`,
      )
      .bind(
        `jobs-v5-${manifest.runId}`,
        manifest.manifestChecksum,
        manifest.counts.new + manifest.counts.changed + manifest.counts.ended,
        manifest.counts.excluded,
        serialize({ runId: manifest.runId, counts: manifest.counts, deletedRows: 0 }),
        publishedAt,
        publishedAt,
      ),
    db
      .prepare(
        `INSERT INTO workflow_publications
          (idempotency_key, run_id, manifest_checksum, inserted_count, updated_count,
           ended_count, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        manifest.db.idempotencyKey,
        manifest.runId,
        manifest.manifestChecksum,
        manifest.counts.new,
        manifest.counts.changed,
        manifest.counts.ended,
        publishedAt,
      ),
    db
      .prepare(
        `UPDATE workflow_runs SET status = 'PUBLISHED', published_at = ?, completed_at = ?
          WHERE run_id = ? AND status = 'VERIFIED' AND manifest_checksum = ?`,
      )
      .bind(publishedAt, publishedAt, manifest.runId, manifest.manifestChecksum),
    db
      .prepare(
        `INSERT INTO workflow_pointers (workflow_id, pointer_name, run_id, updated_at)
         VALUES (?, 'last-success', ?, ?)
         ON CONFLICT(workflow_id, pointer_name) DO UPDATE SET
           run_id = excluded.run_id, updated_at = excluded.updated_at`,
      )
      .bind(manifest.workflowId, manifest.runId, publishedAt),
    db
      .prepare(
        `INSERT INTO workflow_notifications (run_id, status, attempt_count, updated_at)
         VALUES (?, 'PENDING', 0, ?)
         ON CONFLICT(run_id) DO NOTHING`,
      )
      .bind(manifest.runId, publishedAt),
  );
  await db.batch(statements);
  return { status: 'PUBLISHED' as const, runId: manifest.runId, publishedAt };
}

export async function lastPublishedRun(db: D1Database, workflowId: string) {
  return first<{ runId: string; manifest: string; publishedAt: string }>(
    db,
    `SELECT r.run_id AS runId, r.manifest, r.published_at AS publishedAt
       FROM workflow_pointers p
       JOIN workflow_runs r ON r.run_id = p.run_id
      WHERE p.workflow_id = ? AND p.pointer_name = 'last-success' AND r.status = 'PUBLISHED'`,
    workflowId,
  );
}

export async function publishedManifestForNotification(
  db: D1Database,
  workflowId: string,
  targetAsOfDate?: string,
) {
  const row = await lastPublishedRun(db, workflowId);
  if (!row) throw new Error('No PUBLISHED CareerGround run is available.');
  const stored = JSON.parse(row.manifest) as V5Manifest;
  if (targetAsOfDate && stored.targetAsOfDate !== targetAsOfDate) {
    throw new Error('The last PUBLISHED run does not match the requested target date.');
  }
  return {
    ...stored,
    status: 'PUBLISHED',
    publishedAt: row.publishedAt,
    completedAt: row.publishedAt,
    db: { ...stored.db, status: 'PUBLISHED' },
  };
}

type ExistingJobIdentity = {
  id: string;
  sourceUrl: string;
  fingerprint: string | null;
  canonicalJobKey: string | null;
};

type StoredDiscoveryRun = {
  status: string;
  manifest: string | null;
};

export async function publishDiscoveryBundle(db: D1Database, input: unknown, now = new Date()) {
  let validated: Awaited<ReturnType<typeof validateDiscoveryPublishRequest>>;
  try {
    validated = await validateDiscoveryPublishRequest(input, now);
  } catch (error) {
    if (error instanceof RouteError) throw error;
    throw new RouteError(
      422,
      '운영 채용공고 반영 요청 검증에 실패했습니다.',
      'PUBLISH_VALIDATION_FAILED',
      { reason: error instanceof Error ? error.message : String(error) },
    );
  }
  const priorRun = await first<StoredDiscoveryRun>(
    db,
    `SELECT status, manifest FROM workflow_runs WHERE run_id = ?`,
    validated.request.runId,
  );
  if (priorRun) {
    const priorManifest = JSON.parse(priorRun.manifest || '{}') as V5Manifest;
    if (priorManifest.db?.sourceChecksum !== validated.sourceChecksum) {
      throw new Error('The deterministic runId is already bound to a different discovery bundle.');
    }
    if (priorRun.status === 'PUBLISHED') {
      return {
        status: 'ALREADY_PUBLISHED' as const,
        runId: validated.request.runId,
        targetAsOfDate: validated.request.targetAsOfDate,
        inserted: Number(priorManifest.counts?.new || 0),
        skippedExisting: Number(priorManifest.counts?.excluded || 0),
        sourceChecksum: validated.sourceChecksum,
      };
    }
    if (priorRun.status !== 'VERIFIED') {
      throw new Error(`The existing discovery run is not publishable: ${priorRun.status}.`);
    }
    const [savedBeforeRetry, jobsBeforeRetry] = await Promise.all([
      first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM saved_jobs'),
      first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM jobs'),
    ]);
    const publication = await publishVerifiedRun(db, priorManifest);
    const [savedAfterRetry, jobsAfterRetry] = await Promise.all([
      first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM saved_jobs'),
      first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM jobs'),
    ]);
    if (
      Number(savedAfterRetry?.count || 0) !== Number(savedBeforeRetry?.count || 0) ||
      Number(jobsAfterRetry?.count || 0) !==
        Number(jobsBeforeRetry?.count || 0) + Number(priorManifest.counts?.new || 0)
    ) {
      throw new Error('Post-publish D1 retry verification failed.');
    }
    return {
      ...publication,
      targetAsOfDate: priorManifest.targetAsOfDate,
      inserted: Number(priorManifest.counts?.new || 0),
      skippedExisting: Number(priorManifest.counts?.excluded || 0),
      sourceChecksum: validated.sourceChecksum,
      savedJobsUnchanged: true,
      deletedJobs: 0,
    };
  }

  const [baseline, comparableBaseline, savedBefore, jobsBefore] = await Promise.all([
    all<ExistingJobIdentity>(
      db,
      `SELECT id, source_url AS sourceUrl, fingerprint,
              canonical_key AS canonicalJobKey
         FROM jobs`,
    ),
    all<ComparableJob>(
      db,
      `SELECT company_name AS companyName, title,
              application_start_at AS applicationStartAt, deadline_at AS deadlineAt
         FROM jobs
        WHERE status = 'ACTIVE'
          AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
          AND (rolling = 1 OR deadline_at IS NULL OR deadline_at > ?)`,
      now.toISOString(),
    ),
    first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM saved_jobs'),
    first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM jobs'),
  ]);
  const byId = new Map(baseline.map((row) => [row.id, row]));
  const byUrl = new Map(baseline.map((row) => [row.sourceUrl, row]));
  const byFingerprint = new Map(
    baseline.filter((row) => row.fingerprint).map((row) => [String(row.fingerprint), row]),
  );
  const byCanonicalKey = new Map(
    baseline.filter((row) => row.canonicalJobKey).map((row) => [String(row.canonicalJobKey), row]),
  );
  const comparableByCompany = new Map<string, ComparableJob[]>();
  for (const job of comparableBaseline) {
    const key = jobCompanyKey(job.companyName);
    const companyJobs = comparableByCompany.get(key) || [];
    companyJobs.push(job);
    comparableByCompany.set(key, companyJobs);
  }
  const newJobs: Array<Record<string, unknown>> = [];
  let skippedExisting = 0;
  for (const job of validated.jobs) {
    const id = String(job.id);
    const sourceUrl = String(job.sourceUrl);
    const fingerprint = String(job.fingerprint);
    const key = String(job.canonicalJobKey);
    const sameUrl = byUrl.get(sourceUrl);
    const sameId = byId.get(id);
    if (sameUrl || sameId) {
      if (!sameUrl || !sameId || sameUrl.id !== id || sameId.sourceUrl !== sourceUrl) {
        throw new RouteError(
          422,
          '운영 채용공고 식별자가 기존 데이터와 충돌했습니다.',
          'PUBLISH_IDENTITY_CONFLICT',
          { reason: 'IDENTIFIER_COLLISION', sourceUrl },
        );
      }
      skippedExisting += 1;
      continue;
    }
    const sameCanonicalKey = byCanonicalKey.get(key);
    if (sameCanonicalKey) {
      skippedExisting += 1;
      continue;
    }
    const sameFingerprint = byFingerprint.get(fingerprint);
    if (sameFingerprint) {
      throw new RouteError(
        422,
        '운영 채용공고 내용이 기존 공고와 충돌했습니다.',
        'PUBLISH_IDENTITY_CONFLICT',
        {
          reason: 'FINGERPRINT_COLLISION',
          sourceUrl,
          existingSourceUrl: sameFingerprint.sourceUrl,
        },
      );
    }
    const comparable: ComparableJob = {
      companyName: String(job.companyName),
      title: String(job.title),
      applicationStartAt: job.applicationStartAt ? String(job.applicationStartAt) : null,
      deadlineAt: job.deadlineAt ? String(job.deadlineAt) : null,
    };
    const companyKey = jobCompanyKey(comparable.companyName);
    const sameCampaign = (comparableByCompany.get(companyKey) || []).some((existing) =>
      duplicateJobReason(comparable, existing),
    );
    if (sameCampaign) {
      skippedExisting += 1;
      continue;
    }
    newJobs.push(job);
    const companyJobs = comparableByCompany.get(companyKey) || [];
    companyJobs.push(comparable);
    comparableByCompany.set(companyKey, companyJobs);
  }
  if (newJobs.length > 75) {
    throw new RouteError(
      422,
      '한 번에 반영할 수 있는 신규 채용공고 수를 초과했습니다.',
      'PUBLISH_VALIDATION_FAILED',
      { reason: 'NEW_JOB_LIMIT_EXCEEDED', limit: 75, actual: newJobs.length },
    );
  }

  const timestamp = now.toISOString();
  const previous = await lastPublishedRun(db, V5_WORKFLOW_ID);
  const manifest: V5Manifest = {
    schemaVersion: '5.0',
    workflowId: V5_WORKFLOW_ID,
    runId: validated.request.runId,
    runGroupKey: validated.request.runGroupKey,
    targetAsOfDate: validated.request.targetAsOfDate,
    attempt: validated.request.attempt,
    mode: 'PUBLISH',
    status: 'VERIFIED',
    previousSuccessfulRunId: previous?.runId || null,
    errorCode: null,
    errorMessage: null,
    startedAt: validated.startedAt,
    completedAt: timestamp,
    validatedAt: timestamp,
    publishedAt: null,
    manifestChecksum: '',
    counts: {
      new: newJobs.length,
      changed: 0,
      ended: 0,
      excluded: skippedExisting,
      active: newJobs.length,
    },
    db: {
      idempotencyKey: `publish:${V5_WORKFLOW_ID}:${validated.request.runId}`,
      status: 'VERIFIED',
      sourceChecksum: validated.sourceChecksum,
    },
  };
  manifest.manifestChecksum = await v5ManifestChecksum(manifest);
  const verified: V5VerifiedResult = {
    status: 'VERIFIED',
    runId: manifest.runId,
    manifestChecksum: manifest.manifestChecksum,
    newJobs,
    updates: [],
    ended: [],
  };
  await stageVerifiedRun(db, manifest, verified);
  const publication = await publishVerifiedRun(db, manifest);
  const [savedAfter, jobsAfter, publicationCount, batchCount] = await Promise.all([
    first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM saved_jobs'),
    first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM jobs'),
    first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM workflow_publications WHERE run_id = ?',
      manifest.runId,
    ),
    first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM import_batches WHERE id = ?',
      `jobs-v5-${manifest.runId}`,
    ),
  ]);
  if (
    Number(savedAfter?.count || 0) !== Number(savedBefore?.count || 0) ||
    Number(jobsAfter?.count || 0) !== Number(jobsBefore?.count || 0) + newJobs.length ||
    Number(publicationCount?.count || 0) !== 1 ||
    Number(batchCount?.count || 0) !== 1
  ) {
    throw new Error('Post-publish D1 verification failed.');
  }
  return {
    ...publication,
    targetAsOfDate: manifest.targetAsOfDate,
    inserted: newJobs.length,
    skippedExisting,
    sourceChecksum: validated.sourceChecksum,
    savedJobsUnchanged: true,
    deletedJobs: 0,
  };
}
