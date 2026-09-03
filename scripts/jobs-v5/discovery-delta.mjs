#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL, URL } from 'node:url';
import { canonicalSha256, canonicalizeHttpUrl, rawSha256, sha256 } from './canonical-json.mjs';
import { inspectDiscoveryEnums, unsupportedDiscoveryEnumValues } from './canonical-policy.mjs';

export const DISCOVERY_SCHEMA_VERSION = '5.1';
export const DISCOVERY_ARTIFACT_TYPE = 'CAREERGROUND_DISCOVERY_DELTA';
export const DISCOVERY_WORKFLOW_ID = 'CG-JOBS-PROD-V5';

const ALLOWED_GATE_STATUSES = new Set(['PASS', 'PASS_WITH_PARTIAL_COVERAGE']);
const ALLOWED_COVERAGE_STATUSES = new Set(['COMPLETE', 'PARTIAL', 'BLOCKED', 'NO_ACCESS', 'ERROR']);
const REQUIRED_ITEM_FIELDS = [
  'sourceUrl',
  'sourceName',
  'companyName',
  'title',
  'category',
  'careerScope',
  'careerEvidence',
  'employmentType',
  'region',
  'summary',
  'lastVerifiedAt',
];

function fail(code, message, details = undefined) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    fail('DISCOVERY_SCHEMA_INVALID', `${field} is required.`);
  }
  return value.trim();
}

function requireIso(value, field) {
  requireText(value, field);
  if (Number.isNaN(new Date(value).getTime())) {
    fail('DISCOVERY_TIMESTAMP_INVALID', `${field} must be an ISO-8601 timestamp.`);
  }
  return value;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--'))
      fail('DISCOVERY_ARGUMENT_INVALID', `Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/gu, (_, value) => value.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function candidateFingerprint(item) {
  return sha256(
    [item.companyName, item.title, item.region, item.employmentType]
      .map((value) =>
        String(value || '')
          .trim()
          .toLowerCase(),
      )
      .join('|'),
  );
}

function assertSupportedEnums(items, partitionId = undefined) {
  const violations = unsupportedDiscoveryEnumValues(items, partitionId);
  if (violations.length) {
    fail(
      'DISCOVERY_POLICY_INVALID',
      `Unsupported enum values: ${violations
        .map(
          (entry) =>
            `${entry.partitionId === undefined ? '' : `partition ${entry.partitionId} `}items[${entry.itemIndex}].${entry.field}=${JSON.stringify(entry.value)}`,
        )
        .join(', ')}`,
      { violations },
    );
  }
}

function normalizeItem(item, targetAsOfDate, index) {
  if (!isRecord(item)) fail('DISCOVERY_SCHEMA_INVALID', `items[${index}] must be an object.`);
  for (const field of REQUIRED_ITEM_FIELDS) requireText(item[field], `items[${index}].${field}`);
  const sourceUrl = canonicalizeHttpUrl(item.sourceUrl);
  const enumInspection = inspectDiscoveryEnums(item);
  const { careerScope, employmentType, companySize } = enumInspection.values;
  if (enumInspection.violations.some((entry) => entry.field === 'careerScope')) {
    fail('DISCOVERY_POLICY_INVALID', `items[${index}].careerScope is not allowed.`);
  }
  if (item.status !== 'ACTIVE') {
    fail('DISCOVERY_POLICY_INVALID', `items[${index}].status must be ACTIVE.`);
  }
  const rolling = item.rolling === true;
  const deadlineAt = item.deadlineAt ?? null;
  if (!rolling && !deadlineAt) {
    fail('DISCOVERY_POLICY_INVALID', `items[${index}] needs deadlineAt or rolling=true.`);
  }
  if (deadlineAt) {
    requireIso(deadlineAt, `items[${index}].deadlineAt`);
    if (deadlineAt.slice(0, 10) < targetAsOfDate) {
      fail('DISCOVERY_POLICY_INVALID', `items[${index}] is already expired.`);
    }
  }
  requireIso(item.lastVerifiedAt, `items[${index}].lastVerifiedAt`);
  const sourcePostingId = String(item.sourcePostingId || '').trim() || null;
  const canonicalJobKey = sourcePostingId
    ? `source:${new URL(sourceUrl).hostname}:${sourcePostingId}`
    : `url:${sourceUrl}`;
  const timestamp = item.lastVerifiedAt;
  if (enumInspection.violations.some((entry) => entry.field === 'employmentType')) {
    fail('DISCOVERY_POLICY_INVALID', `items[${index}].employmentType is not allowed.`);
  }
  if (enumInspection.violations.some((entry) => entry.field === 'companySize')) {
    fail('DISCOVERY_POLICY_INVALID', `items[${index}].companySize is not allowed.`);
  }
  const fingerprint = candidateFingerprint({ ...item, employmentType });
  return {
    id: `job-${sha256(sourceUrl).slice(0, 24)}`,
    canonicalJobKey,
    fingerprint,
    sourceUrl,
    sourceName: item.sourceName.trim(),
    sourcePostingId,
    companyName: item.companyName.trim(),
    companySize,
    companySizeEvidence: String(item.companySizeEvidence || ''),
    title: item.title.trim(),
    category: item.category.trim(),
    careerScope,
    careerEvidence: item.careerEvidence.trim(),
    employmentType,
    region: item.region.trim(),
    remote: item.remote === true,
    techStack: Array.isArray(item.techStack) ? item.techStack.map(String) : [],
    publishedAt: item.publishedAt ?? null,
    applicationStartAt: item.applicationStartAt ?? null,
    deadlineAt,
    rolling,
    summary: item.summary.trim(),
    status: 'ACTIVE',
    collectedAt: item.collectedAt || timestamp,
    lastVerifiedAt: timestamp,
    createdAt: item.createdAt || timestamp,
    updatedAt: item.updatedAt || timestamp,
  };
}

export function validateDiscoveryDelta(value, { partitionPolicy, targetAsOfDate }) {
  if (!isRecord(value)) fail('DISCOVERY_SCHEMA_INVALID', 'Discovery JSON must be an object.');
  if (
    value.schemaVersion !== DISCOVERY_SCHEMA_VERSION ||
    value.artifactType !== DISCOVERY_ARTIFACT_TYPE ||
    value.workflowId !== DISCOVERY_WORKFLOW_ID
  ) {
    fail('DISCOVERY_IDENTITY_INVALID', 'Discovery schema, artifact type, or workflow is invalid.');
  }
  if (
    value.targetAsOfDate !== targetAsOfDate ||
    value.runGroupKey !== `CG-${targetAsOfDate}` ||
    value.timezone !== 'Asia/Seoul'
  ) {
    fail('DISCOVERY_DATE_INVALID', 'Discovery date identity is invalid.');
  }
  if (value.partitionId !== partitionPolicy.partitionId) {
    fail('DISCOVERY_PARTITION_INVALID', 'partitionId does not match the expected partition.');
  }
  if (!Number.isInteger(value.attempt) || value.attempt < 1 || value.attempt > 99) {
    fail('DISCOVERY_ATTEMPT_INVALID', 'attempt must be an integer from 1 to 99.');
  }
  if (value.status !== 'SUCCESS') fail('DISCOVERY_REPORTED_FAILURE', 'Discovery did not succeed.');
  for (const field of ['startedAt', 'completedAt', 'exportedAt']) requireIso(value[field], field);
  if (value.exportedAt.slice(0, 10) !== targetAsOfDate) {
    fail('DISCOVERY_DATE_INVALID', 'exportedAt must use the target Asia/Seoul date.');
  }
  if (!Array.isArray(value.sources) || !Array.isArray(value.items)) {
    fail('DISCOVERY_SCHEMA_INVALID', 'sources and items must be arrays.');
  }
  const expectedSources = [...partitionPolicy.sources].sort();
  const actualSources = [...new Set(value.sources.map(String))].sort();
  if (JSON.stringify(actualSources) !== JSON.stringify(expectedSources)) {
    fail('DISCOVERY_SOURCE_OWNERSHIP_INVALID', 'sources do not match partition ownership.');
  }
  if (value.rowCount !== value.items.length) {
    fail('DISCOVERY_ROW_COUNT_MISMATCH', 'rowCount does not match items.length.');
  }
  if (
    !Array.isArray(value.sourceCoverage) ||
    value.sourceCoverage.length !== expectedSources.length
  ) {
    fail('DISCOVERY_COVERAGE_INVALID', 'sourceCoverage must contain every assigned source once.');
  }
  const coverageNames = new Set();
  const normalizedCoverage = [];
  let coverageAliasesNormalized = 0;
  for (const [index, coverage] of value.sourceCoverage.entries()) {
    if (!isRecord(coverage))
      fail('DISCOVERY_COVERAGE_INVALID', `sourceCoverage[${index}] is invalid.`);
    if (
      typeof coverage.sourceName === 'string' &&
      typeof coverage.source === 'string' &&
      coverage.sourceName.trim() !== coverage.source.trim()
    ) {
      fail(
        'DISCOVERY_COVERAGE_INVALID',
        `sourceCoverage[${index}] has conflicting sourceName and source values.`,
      );
    }
    const usesLegacySourceAlias =
      typeof coverage.sourceName !== 'string' && typeof coverage.source === 'string';
    const sourceName = requireText(
      coverage.sourceName ?? coverage.source,
      `sourceCoverage[${index}].sourceName`,
    );
    if (!expectedSources.includes(sourceName) || coverageNames.has(sourceName)) {
      fail('DISCOVERY_COVERAGE_INVALID', 'sourceCoverage has an unknown or duplicate source.');
    }
    coverageNames.add(sourceName);
    if (!ALLOWED_COVERAGE_STATUSES.has(String(coverage.status))) {
      fail('DISCOVERY_COVERAGE_INVALID', `sourceCoverage[${index}].status is invalid.`);
    }
    if (usesLegacySourceAlias) coverageAliasesNormalized += 1;
    normalizedCoverage.push({
      sourceName,
      status: String(coverage.status),
      notes: String(coverage.notes ?? coverage.note ?? coverage.detail ?? ''),
    });
  }
  if (!normalizedCoverage.some((entry) => ['COMPLETE', 'PARTIAL'].includes(entry.status))) {
    fail('DISCOVERY_COVERAGE_INVALID', 'At least one assigned source must be investigated.');
  }
  if (!isRecord(value.qualityGates) || !ALLOWED_GATE_STATUSES.has(value.qualityGates.overall)) {
    fail('DISCOVERY_QUALITY_GATE_INVALID', 'qualityGates.overall is not passable.');
  }
  if (!Array.isArray(value.blockingErrors) || value.blockingErrors.length) {
    fail('DISCOVERY_BLOCKING_ERROR', 'blockingErrors must be an empty array.');
  }
  if (value.productionDatabaseChanged !== false || value.slackSent !== false) {
    fail('DISCOVERY_SIDE_EFFECT_INVALID', 'Collector must not change production DB or Slack.');
  }
  if (!Array.isArray(value.excluded) || !Array.isArray(value.uncertain)) {
    fail('DISCOVERY_SCHEMA_INVALID', 'excluded and uncertain must be arrays.');
  }
  assertSupportedEnums(value.items, value.partitionId);
  const normalizedItems = value.items.map((item, index) =>
    normalizeItem(item, targetAsOfDate, index),
  );
  const itemAliasesNormalized = normalizedItems.reduce((count, item, index) => {
    return count + inspectDiscoveryEnums(value.items[index]).changes.length;
  }, 0);
  const seenUrls = new Set();
  for (const [index, item] of normalizedItems.entries()) {
    if (!expectedSources.includes(item.sourceName)) {
      fail('DISCOVERY_SOURCE_OWNERSHIP_INVALID', `items[${index}].sourceName is not assigned.`);
    }
    if (seenUrls.has(item.sourceUrl)) {
      fail('DISCOVERY_DUPLICATE_URL', `Duplicate sourceUrl: ${item.sourceUrl}`);
    }
    seenUrls.add(item.sourceUrl);
  }
  return {
    value,
    normalizedItems,
    normalizedCoverage,
    descriptor: {
      partitionId: value.partitionId,
      attempt: value.attempt,
      rowCount: normalizedItems.length,
      coverage: Object.fromEntries(
        normalizedCoverage.map((entry) => [entry.sourceName, entry.status]),
      ),
      coverageAliasesNormalized,
      itemAliasesNormalized,
      rawSha256: null,
      canonicalSha256: canonicalSha256(value),
    },
  };
}

export function validateDiscoveryBundle({ partitionPaths, targetAsOfDate, sourcePolicy, runId }) {
  if (!Array.isArray(partitionPaths) || partitionPaths.length !== 3) {
    fail('DISCOVERY_PARTITION_COUNT_INVALID', 'Exactly three partition paths are required.');
  }
  const inputs = partitionPaths.map((path) => {
    const raw = readFileSync(resolve(path));
    const value = JSON.parse(raw.toString('utf8'));
    return { raw, value };
  });
  const enumViolations = inputs.flatMap(({ value }, index) =>
    unsupportedDiscoveryEnumValues(value?.items, value?.partitionId ?? index + 1),
  );
  if (enumViolations.length) {
    fail(
      'DISCOVERY_POLICY_INVALID',
      `Unsupported enum values were found in ${enumViolations.length} field(s).`,
      { violations: enumViolations },
    );
  }
  const partitions = inputs.map(({ raw, value }, index) => {
    const loaded = validateDiscoveryDelta(value, {
      partitionPolicy: sourcePolicy.partitions[index],
      targetAsOfDate,
    });
    loaded.descriptor.rawSha256 = rawSha256(raw);
    return loaded;
  });
  const byUrl = new Map();
  const byFingerprint = new Map();
  const potentialDuplicates = [];
  for (const partition of partitions) {
    for (const item of partition.normalizedItems) {
      const urlOwner = byUrl.get(item.sourceUrl);
      if (urlOwner) {
        fail('DISCOVERY_CROSS_PARTITION_URL_DUPLICATE', 'sourceUrl appears in two partitions.', {
          sourceUrl: item.sourceUrl,
          partitionIds: [urlOwner.partitionId, partition.value.partitionId],
        });
      }
      byUrl.set(item.sourceUrl, { partitionId: partition.value.partitionId, item });
      const fingerprintOwner = byFingerprint.get(item.fingerprint);
      if (fingerprintOwner && fingerprintOwner.item.sourceUrl !== item.sourceUrl) {
        potentialDuplicates.push({
          fingerprint: item.fingerprint,
          sourceUrls: [fingerprintOwner.item.sourceUrl, item.sourceUrl].sort(),
          partitionIds: [fingerprintOwner.partitionId, partition.value.partitionId].sort(),
        });
      } else if (!fingerprintOwner) {
        byFingerprint.set(item.fingerprint, { partitionId: partition.value.partitionId, item });
      }
    }
  }
  const normalizedPartitions = partitions.map((partition) => ({
    schemaVersion: '5.0',
    workflowId: DISCOVERY_WORKFLOW_ID,
    runId,
    runGroupKey: `CG-${targetAsOfDate}`,
    targetAsOfDate,
    partitionId: partition.value.partitionId,
    status: 'SUCCESS',
    sources: partition.value.sources,
    startedAt: partition.value.startedAt,
    completedAt: partition.value.completedAt,
    exportedAt: partition.value.exportedAt,
    rowCount: partition.normalizedItems.length,
    items: partition.normalizedItems,
    errorCode: null,
    errorMessage: null,
  }));
  return {
    report: {
      schemaVersion: DISCOVERY_SCHEMA_VERSION,
      artifactType: 'CAREERGROUND_DISCOVERY_BUNDLE_REPORT',
      workflowId: DISCOVERY_WORKFLOW_ID,
      runId,
      runGroupKey: `CG-${targetAsOfDate}`,
      targetAsOfDate,
      status: 'VERIFIED_DISCOVERY',
      rowCount: normalizedPartitions.reduce((sum, partition) => sum + partition.rowCount, 0),
      partitionCounts: normalizedPartitions.map((partition) => ({
        partitionId: partition.partitionId,
        rowCount: partition.rowCount,
      })),
      potentialDuplicateCount: potentialDuplicates.length,
      potentialDuplicates,
      enumNormalizations: partitions.reduce(
        (sum, partition) => sum + partition.descriptor.itemAliasesNormalized,
        0,
      ),
      productionDatabaseChanged: false,
      slackSent: false,
    },
    normalizedPartitions,
  };
}

export function writeDiscoveryBundle(output, bundle) {
  const directory = resolve(output);
  mkdirSync(directory, { recursive: true });
  for (const partition of bundle.normalizedPartitions) {
    writeFileSync(
      resolve(directory, `partition-${partition.partitionId}.json`),
      `${JSON.stringify(partition, null, 2)}\n`,
    );
  }
  const reportPath = resolve(directory, 'discovery-report.json');
  writeFileSync(reportPath, `${JSON.stringify(bundle.report, null, 2)}\n`);
  return reportPath;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  for (const field of [
    'targetAsOfDate',
    'runId',
    'partition1',
    'partition2',
    'partition3',
    'output',
  ]) {
    if (!args[field]) fail('DISCOVERY_ARGUMENT_MISSING', `--${field} is required.`);
  }
  const sourcePolicy = JSON.parse(
    readFileSync(resolve(args.policy || 'config/careerground-partition-sources.json'), 'utf8'),
  );
  const bundle = validateDiscoveryBundle({
    partitionPaths: [args.partition1, args.partition2, args.partition3],
    targetAsOfDate: String(args.targetAsOfDate),
    sourcePolicy,
    runId: String(args.runId),
  });
  const reportPath = writeDiscoveryBundle(args.output, bundle);
  return { ...bundle.report, reportPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${JSON.stringify(main(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ status: 'FAILED_DISCOVERY', errorCode: error?.code || 'UNEXPECTED_ERROR', errorMessage: error instanceof Error ? error.message : String(error), errorDetails: error?.details })}\n`,
    );
    process.exitCode = 1;
  }
}
