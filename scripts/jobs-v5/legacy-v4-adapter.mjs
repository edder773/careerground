import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  SCHEMA_VERSION,
  V5Error,
  WORKFLOW_ID,
  assertExecutionIdentity,
  assertIsoTimestamp,
} from './contracts.mjs';
import {
  canonicalizeHttpUrl,
  normalizeDownloadDisplayName,
  rawSha256,
  sha256,
} from './canonical-json.mjs';

const LEGACY_ARTIFACT_TYPE = 'CAREERGROUND_PARTITION_RESULT';
const LEGACY_AUDIT_TYPE = 'CAREERGROUND_MERGE_AUDIT';
const ALLOWED_LEGACY_GATES = new Set([
  'PASS',
  'PASS_WITH_PARTIAL_SOURCE_COVERAGE',
  'PASS_WITH_COVERAGE_LIMITATIONS',
]);

function fail(code, message, details) {
  throw new V5Error(code, message, 'FAILED_INPUT', details);
}

function readJsonArtifact(path, label) {
  const absolutePath = resolve(path);
  let raw;
  try {
    raw = readFileSync(absolutePath);
  } catch (error) {
    fail('LEGACY_ARTIFACT_MISSING', `Cannot read ${label}: ${absolutePath}`, {
      cause: String(error),
    });
  }
  let value;
  try {
    value = JSON.parse(raw.toString('utf8'));
  } catch {
    fail('LEGACY_ARTIFACT_JSON_INVALID', `${label} is not valid JSON: ${absolutePath}`);
  }
  return { absolutePath, raw, value };
}

function pythonCanonicalValue(value) {
  if (Array.isArray(value)) return value.map((entry) => pythonCanonicalValue(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, pythonCanonicalValue(value[key])]),
    );
  }
  return value;
}

export function legacyCanonicalStringify(value) {
  return JSON.stringify(pythonCanonicalValue(value));
}

export function legacyCanonicalSha256(value) {
  return sha256(Buffer.from(legacyCanonicalStringify(value), 'utf8'));
}

export function legacyArtifactCanonicalSha256(value) {
  const copy = pythonCanonicalValue(value);
  if (!copy.integrity || typeof copy.integrity !== 'object') {
    fail('LEGACY_PARTITION_INTEGRITY_MISSING', 'Legacy partition integrity is required.');
  }
  copy.integrity.artifactCanonicalSha256 = '';
  return legacyCanonicalSha256(copy);
}

export function legacyBucketForId(id) {
  const prefix = createHash('sha256').update(String(id), 'utf8').digest('hex').slice(0, 8);
  return Number.parseInt(prefix, 16) % 3;
}

function parseTechStack(value, id) {
  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string'))
        return parsed;
    } catch {
      // A structured error below keeps the job id in the diagnostic.
    }
  }
  fail('LEGACY_TECH_STACK_INVALID', `Job ${id} has an invalid tech_stack value.`);
}

export function normalizeLegacyJob(job) {
  const required = [
    'id',
    'source_url',
    'fingerprint',
    'source_name',
    'company_name',
    'title',
    'category',
    'career_scope',
    'status',
    'last_verified_at',
  ];
  for (const field of required) {
    if (typeof job?.[field] !== 'string' || !job[field].trim()) {
      fail('LEGACY_JOB_FIELD_MISSING', `Legacy job field ${field} is required.`, {
        id: job?.id || null,
      });
    }
  }
  const canonicalJobKey = canonicalizeHttpUrl(job.source_url);
  assertIsoTimestamp(job.last_verified_at, 'legacyJob.last_verified_at');
  if (job.deadline_at !== null && job.deadline_at !== undefined) {
    assertIsoTimestamp(job.deadline_at, 'legacyJob.deadline_at');
  }
  return {
    id: job.id,
    canonicalJobKey,
    fingerprint: job.fingerprint,
    sourceUrl: job.source_url,
    sourceName: job.source_name,
    sourcePostingId: job.source_posting_id ?? null,
    companyName: job.company_name,
    companySize: job.company_size ?? null,
    companySizeEvidence: job.company_size_evidence ?? '',
    title: job.title,
    category: job.category,
    careerScope: job.career_scope,
    careerEvidence: job.career_evidence ?? '',
    employmentType: job.employment_type ?? null,
    region: job.region ?? null,
    remote: Boolean(job.remote),
    techStack: parseTechStack(job.tech_stack, job.id),
    publishedAt: job.published_at ?? null,
    applicationStartAt: job.application_start_at ?? null,
    deadlineAt: job.deadline_at ?? null,
    rolling: Boolean(job.rolling),
    summary: job.summary ?? '',
    status: job.status,
    collectedAt: job.collected_at ?? null,
    lastVerifiedAt: job.last_verified_at,
    createdAt: job.created_at ?? null,
    updatedAt: job.updated_at ?? null,
  };
}

function assertUnique(values, code, label) {
  if (new Set(values).size !== values.length) fail(code, `${label} must be unique.`);
}

function countStatuses(items) {
  const counts = {};
  for (const item of items) counts[item.status] = (counts[item.status] || 0) + 1;
  return counts;
}

function sameObject(left, right) {
  return legacyCanonicalStringify(left) === legacyCanonicalStringify(right);
}

function validateFinal(finalArtifact, audit, identity) {
  const { raw, value: final } = finalArtifact;
  if (
    final.timezone !== 'Asia/Seoul' ||
    final.project !== 'careerground-workspace' ||
    final.table !== 'jobs' ||
    !Array.isArray(final.items)
  ) {
    fail('LEGACY_FINAL_SCHEMA_INVALID', 'Legacy final snapshot metadata is invalid.');
  }
  if (final.exportedAt?.slice(0, 10) !== identity.targetAsOfDate) {
    fail('LEGACY_FINAL_DATE_MISMATCH', 'Final exportedAt does not match targetAsOfDate.');
  }
  assertIsoTimestamp(final.exportedAt, 'legacyFinal.exportedAt');
  if (final.rowCount !== final.items.length) {
    fail('LEGACY_FINAL_ROW_COUNT_MISMATCH', 'Final rowCount does not match items.length.');
  }
  if (!sameObject(countStatuses(final.items), final.statusCounts)) {
    fail('LEGACY_FINAL_STATUS_COUNT_MISMATCH', 'Final statusCounts do not match the items.');
  }
  assertUnique(
    final.items.map((item) => item.id),
    'LEGACY_FINAL_DUPLICATE_ID',
    'Final job id',
  );
  assertUnique(
    final.items.map((item) => canonicalizeHttpUrl(item.source_url)),
    'LEGACY_FINAL_DUPLICATE_URL',
    'Final canonical source_url',
  );
  assertUnique(
    final.items.map((item) => item.fingerprint),
    'LEGACY_FINAL_DUPLICATE_FINGERPRINT',
    'Final fingerprint',
  );
  const expected = audit.finalSnapshot;
  if (!expected || expected.fileName !== basename(finalArtifact.absolutePath)) {
    fail('LEGACY_AUDIT_FINAL_NAME_MISMATCH', 'Audit finalSnapshot fileName mismatch.');
  }
  if (
    expected.rowCount !== final.rowCount ||
    !sameObject(expected.statusCounts, final.statusCounts) ||
    expected.rawBytesSha256 !== rawSha256(raw) ||
    expected.canonicalJsonSha256 !== legacyCanonicalSha256(final)
  ) {
    fail('LEGACY_AUDIT_FINAL_HASH_MISMATCH', 'Audit finalSnapshot does not match the final JSON.');
  }
  if (audit.baseline?.rowCount + expected.newRowsAdded !== final.rowCount) {
    fail(
      'LEGACY_FINAL_DELTA_MISMATCH',
      'Baseline rowCount plus newRowsAdded must equal final rowCount.',
    );
  }
  return final;
}

function validateLegacyPartition(
  artifact,
  auditEntry,
  identity,
  expectedPartitionId,
  baselineHash,
) {
  const { raw, value } = artifact;
  if (
    value.version !== '4.0' ||
    value.artifactType !== LEGACY_ARTIFACT_TYPE ||
    value.partitionId !== expectedPartitionId ||
    value.asOfDate !== identity.targetAsOfDate ||
    value.timezone !== 'Asia/Seoul'
  ) {
    fail(
      'LEGACY_PARTITION_SCHEMA_INVALID',
      `Partition ${expectedPartitionId} metadata is invalid.`,
    );
  }
  if (value.runGroupKey !== auditEntry.runGroupKey) {
    fail(
      'LEGACY_PARTITION_RUN_GROUP_MISMATCH',
      `Partition ${expectedPartitionId} runGroupKey mismatch.`,
    );
  }
  if (!ALLOWED_LEGACY_GATES.has(value.qualityGates?.overall)) {
    fail('LEGACY_PARTITION_GATE_FAILED', `Partition ${expectedPartitionId} did not pass its gate.`);
  }
  if (!Array.isArray(value.blockingErrors) || value.blockingErrors.length > 0) {
    fail('LEGACY_PARTITION_BLOCKED', `Partition ${expectedPartitionId} has blocking errors.`);
  }
  for (const field of ['existingDecisions', 'discovered', 'newDecisions', 'sourceCoverage']) {
    if (!Array.isArray(value[field])) {
      fail(
        'LEGACY_PARTITION_PAYLOAD_MISSING',
        `Partition ${expectedPartitionId}.${field} is required.`,
      );
    }
  }
  const artifactHash = legacyArtifactCanonicalSha256(value);
  if (
    value.integrity?.artifactCanonicalSha256 !== artifactHash ||
    auditEntry.artifactCanonicalSha256 !== artifactHash ||
    auditEntry.rawBytesSha256 !== rawSha256(raw) ||
    value.integrity?.baselineCanonicalSha256 !== baselineHash ||
    value.baseline?.canonicalJsonSha256 !== baselineHash ||
    auditEntry.qualityGateOverall !== value.qualityGates.overall ||
    auditEntry.blockingErrorsCount !== 0 ||
    auditEntry.fullJsonParsed !== true
  ) {
    fail(
      'LEGACY_PARTITION_INTEGRITY_MISMATCH',
      `Partition ${expectedPartitionId} does not match the merge audit.`,
    );
  }
  return value;
}

export function loadLegacyV4Bundle({ partitionPaths, finalPath, auditPath, identity }) {
  assertExecutionIdentity(identity);
  if (!Array.isArray(partitionPaths) || partitionPaths.length !== 3) {
    fail('LEGACY_PARTITION_INPUT_COUNT', 'Exactly three legacy partition paths are required.');
  }
  const auditArtifact = readJsonArtifact(auditPath, 'legacy merge audit');
  const audit = auditArtifact.value;
  if (
    audit.artifactType !== LEGACY_AUDIT_TYPE ||
    audit.protocolVersion !== '4.0' ||
    audit.targetAsOfDate !== identity.targetAsOfDate ||
    audit.timezone !== 'Asia/Seoul' ||
    audit.inputCompleteness !== 'PASS' ||
    audit.qualityGates?.overall !== 'PASS' ||
    audit.qualityGates?.outputIntegrity !== 'PASS' ||
    audit.downstreamEligibility !== 'ELIGIBLE' ||
    !Array.isArray(audit.blockingErrors) ||
    audit.blockingErrors.length > 0
  ) {
    fail('LEGACY_AUDIT_NOT_ELIGIBLE', 'Legacy merge audit is not eligible for v5 ingestion.');
  }
  if (!Array.isArray(audit.partitions) || audit.partitions.length !== 3) {
    fail('LEGACY_AUDIT_PARTITION_COUNT', 'Legacy merge audit must contain three partitions.');
  }
  const baselineHash = audit.baseline?.canonicalJsonSha256;
  if (!/^[a-f0-9]{64}$/.test(String(baselineHash))) {
    fail('LEGACY_BASELINE_HASH_INVALID', 'Legacy baseline canonical hash is missing or invalid.');
  }
  const artifacts = partitionPaths.map((path, index) =>
    readJsonArtifact(path, `legacy partition ${index + 1}`),
  );
  const partitions = artifacts.map((artifact, index) => {
    const partitionId = index + 1;
    const auditEntry = audit.partitions.find((entry) => entry.partitionId === partitionId);
    if (!auditEntry)
      fail('LEGACY_AUDIT_PARTITION_MISSING', `Audit partition ${partitionId} missing.`);
    return validateLegacyPartition(artifact, auditEntry, identity, partitionId, baselineHash);
  });
  const legacyRunGroups = new Set(partitions.map((partition) => partition.runGroupKey));
  if (legacyRunGroups.size !== 1 || !legacyRunGroups.has(audit.runGroupKey)) {
    fail('LEGACY_PARTITION_MIXED_RUN', 'Legacy partitions do not share the audit runGroupKey.');
  }
  const finalArtifact = readJsonArtifact(finalPath, 'legacy final snapshot');
  const final = validateFinal(finalArtifact, audit, identity);
  const normalizedItems = final.items.map(normalizeLegacyJob);
  const partitionResults = partitions.map((partition) => {
    const items = normalizedItems.filter(
      (item) => legacyBucketForId(item.id) === partition.partitionId - 1,
    );
    const startedAt = partition.timestamps?.researchStartedAt;
    const completedAt = partition.timestamps?.filesGeneratedAt;
    assertIsoTimestamp(startedAt, `partition${partition.partitionId}.researchStartedAt`);
    assertIsoTimestamp(completedAt, `partition${partition.partitionId}.filesGeneratedAt`);
    return {
      schemaVersion: SCHEMA_VERSION,
      workflowId: WORKFLOW_ID,
      runId: identity.runId,
      runGroupKey: identity.runGroupKey,
      targetAsOfDate: identity.targetAsOfDate,
      partitionId: partition.partitionId,
      status: 'SUCCESS',
      sources: [...partition.assignedDiscoverySources],
      startedAt,
      completedAt,
      exportedAt: final.exportedAt,
      rowCount: items.length,
      items,
      errorCode: null,
      errorMessage: null,
    };
  });
  return {
    partitionResults,
    report: {
      schemaVersion: SCHEMA_VERSION,
      workflowId: WORKFLOW_ID,
      runId: identity.runId,
      runGroupKey: identity.runGroupKey,
      targetAsOfDate: identity.targetAsOfDate,
      legacyRunGroupKey: audit.runGroupKey,
      status: 'VERIFIED_COMPATIBLE',
      baseline: {
        rowCount: audit.baseline.rowCount,
        canonicalJsonSha256: baselineHash,
      },
      finalSnapshot: {
        displayName: normalizeDownloadDisplayName(basename(finalPath)),
        rowCount: final.rowCount,
        statusCounts: final.statusCounts,
        rawBytesSha256: rawSha256(finalArtifact.raw),
        canonicalJsonSha256: legacyCanonicalSha256(final),
      },
      partitions: partitionResults.map((result, index) => ({
        partitionId: result.partitionId,
        rowCount: result.rowCount,
        sources: result.sources,
        legacyRawSha256: rawSha256(artifacts[index].raw),
        legacyCanonicalSha256: legacyArtifactCanonicalSha256(partitions[index]),
      })),
      audit: {
        rawSha256: rawSha256(auditArtifact.raw),
        qualityGate: audit.qualityGates.overall,
        downstreamEligibility: audit.downstreamEligibility,
      },
      productionDatabaseChanged: false,
      slackSent: false,
    },
  };
}

export function writeLegacyV4Conversion(outputDirectory, bundle) {
  const directory = resolve(outputDirectory);
  mkdirSync(directory, { recursive: true });
  for (const result of bundle.partitionResults) {
    writeFileSync(
      resolve(directory, `partition-${result.partitionId}.json`),
      `${JSON.stringify(result, null, 2)}\n`,
    );
  }
  const reportPath = resolve(directory, 'compatibility-report.json');
  writeFileSync(reportPath, `${JSON.stringify(bundle.report, null, 2)}\n`);
  return reportPath;
}
