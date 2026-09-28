#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import sourcePolicy from '../../config/careerground-partition-sources.json' with { type: 'json' };
import { canonicalSha256 } from './canonical-json.mjs';
import { validateDiscoveryBundle } from './discovery-delta.mjs';

export const ALERT_SCHEMA_VERSION = '1.0';
export const ALERT_ARTIFACT_TYPE = 'CAREERGROUND_ALERT_READY';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => Object.assign(new Error(message), { code });
const collectionSources = [
  ['JobKorea', 'Wanted', 'Catch'],
  ['Superookie', 'Work24', 'Saramin'],
  ['Jumpit', 'Inthiswork', 'Remember Career'],
  ['RocketPunch', 'Incruit', 'LinkedIn Korea'],
  ['Jasoseol', 'Linkareer', 'JOB-ALIO'],
];
const dateInSeoul = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || !/(Z|[+-]\d\d:\d\d)$/u.test(iso)) {
    throw fail('ALERT_TIMESTAMP_INVALID', 'A timezone-qualified timestamp is required.');
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const evidenceText = (value) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
};

export const candidateVersion = (item) => canonicalSha256(item);

export const toAlertCandidate = (item) => ({
  candidateId: item.candidateId,
  companyName: item.companyName,
  title: item.title,
  sourceName: item.sourceName,
  sourceUrl: item.sourceUrl,
  deadlineAt: item.deadlineAt ?? null,
  careerScope: item.careerScope,
  status: item.status,
  rolling: item.rolling === true,
  lastVerifiedAt: item.lastVerifiedAt,
});

const zonedTime = (value) =>
  typeof value === 'string' && /(Z|[+-]\d\d:\d\d)$/u.test(value) ? Date.parse(value) : Number.NaN;

export function alertCandidateBlockReason(item, targetAsOfDate, latestReviewTime) {
  if (item.status !== 'ACTIVE') return 'NOT_ACTIVE';
  if (!['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE'].includes(item.careerScope)) return 'CAREER_SCOPE';
  if (item.rolling === true) return 'ROLLING_EXCLUDED';
  const deadline = zonedTime(item.deadlineAt);
  if (!Number.isFinite(deadline)) return 'DEADLINE_NOT_PRECISE';
  if (deadline <= latestReviewTime) return 'EXPIRED';
  const verified = zonedTime(item.lastVerifiedAt);
  if (!Number.isFinite(verified)) return 'VERIFIED_TIME_INVALID';
  if (verified > latestReviewTime) return 'VERIFIED_AFTER_REVIEW';
  if (dateInSeoul(item.lastVerifiedAt) !== targetAsOfDate) return 'VERIFIED_DATE_MISMATCH';
  if (latestReviewTime - verified >= 6 * 60 * 60 * 1000) return 'STALE_VERIFICATION';
  for (const field of [
    'sourceName',
    'sourceUrl',
    'companyName',
    'title',
    'category',
    'region',
    'summary',
  ]) {
    if (!String(item[field] || '').trim()) return `MISSING_${field}`;
  }
  if (!evidenceText(item.careerEvidence).trim()) return 'CAREER_EVIDENCE_MISSING';
  return null;
}

function readJson(path) {
  const bytes = readFileSync(resolve(path));
  return { bytes, value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/u, '')) };
}

export function validateReviewReport({
  value,
  role,
  manifestId,
  manifestSha256,
  runId,
  targetAsOfDate,
  candidateIndex,
}) {
  const byCandidate = new Map(candidateIndex.map((entry) => [entry.candidateId, entry]));
  if (
    value.schemaVersion !== '2.1' ||
    value.runId !== runId ||
    value.inputManifestId !== manifestId ||
    value.inputManifestSha256 !== manifestSha256 ||
    Number(value.role) !== role ||
    value.stage !== 'REVIEW' ||
    value.status !== 'COMPLETE' ||
    !Array.isArray(value.blockingErrors) ||
    value.blockingErrors.length ||
    dateInSeoul(value.reviewedAt) !== targetAsOfDate ||
    !Array.isArray(value.decisions) ||
    value.decisions.length !== candidateIndex.length
  ) {
    throw fail('ALERT_REVIEW_MISMATCH', `Review ${role} is incomplete or stale.`);
  }
  const decisions = new Map(value.decisions.map((entry) => [entry.candidateId, entry]));
  if (
    decisions.size !== candidateIndex.length ||
    candidateIndex.some((candidate) => {
      const decision = decisions.get(candidate.candidateId);
      return (
        !decision ||
        !['PASS', 'HOLD', 'REJECT'].includes(decision.verdict) ||
        !String(decision.reason || '').trim() ||
        decision.candidateSha256 !== byCandidate.get(candidate.candidateId).candidateSha256 ||
        (decision.verdict === 'PASS' &&
          (!Array.isArray(decision.evidence) ||
            !decision.evidence.length ||
            !decision.alertCandidate ||
            typeof decision.alertCandidate !== 'object' ||
            canonicalSha256(decision.alertCandidate) !== canonicalSha256(candidate.alertCandidate)))
      );
    })
  ) {
    throw fail(
      'ALERT_REVIEW_DECISIONS',
      `Review ${role} must decide the same candidate version once.`,
    );
  }
  return decisions;
}

export function buildAlertReady({
  manifestId,
  manifestPath,
  collectionPaths,
  reviewPaths,
  currentStatePath,
  targetAsOfDate,
  attempt = 1,
}) {
  if (!manifestId || !/^\d{4}-\d{2}-\d{2}$/u.test(targetAsOfDate)) {
    throw fail('ALERT_IDENTITY_INVALID', 'manifestId and targetAsOfDate are required.');
  }
  if (collectionPaths?.length !== 5 || reviewPaths?.length !== 3 || !currentStatePath) {
    throw fail(
      'ALERT_INPUT_COUNT',
      'Five collections, three reviews, and one current state are required.',
    );
  }
  const { bytes: manifestBytes, value: manifest } = readJson(manifestPath);
  const sourceRunId = `CG-${targetAsOfDate}-A${attempt}`;
  if (
    manifest.runId !== sourceRunId ||
    manifest.targetAsOfDate !== targetAsOfDate ||
    manifest.attempt !== attempt ||
    manifest.collections?.length !== 5
  ) {
    throw fail('ALERT_MANIFEST_MISMATCH', 'Manifest does not identify this collection attempt.');
  }
  const loadedCollections = collectionPaths.map(readJson);
  const { bytes: currentStateBytes, value: currentState } = readJson(currentStatePath);
  if (
    !manifest.currentState?.fileId ||
    currentStateBytes.length !== Number(manifest.currentState.size) ||
    hash(currentStateBytes) !== manifest.currentState.sha256 ||
    currentState.runId !== sourceRunId ||
    currentState.complete !== true ||
    currentState.truncated !== false ||
    !Number.isFinite(zonedTime(currentState.capturedAt)) ||
    ![
      'jobs',
      'slack_digest_items',
      'slack_digest_job_reservations',
      'slack_digest_deliveries',
    ].every((table) => Array.isArray(currentState.tables?.[table]))
  ) {
    throw fail('ALERT_CURRENT_STATE_INVALID', 'Frozen current DB/SENT state is incomplete.');
  }
  const candidateById = new Map();
  const coverageBySource = new Map();
  for (let index = 0; index < 5; index += 1) {
    const { bytes, value } = loadedCollections[index];
    const frozen = manifest.collections.find((entry) => entry.partitionId === index + 1);
    if (
      !frozen ||
      bytes.length !== Number(frozen.size) ||
      hash(bytes) !== frozen.sha256 ||
      value.partitionId !== index + 1 ||
      value.runId !== sourceRunId ||
      value.targetAsOfDate !== targetAsOfDate ||
      value.attempt !== attempt ||
      !['COMPLETE', 'PARTIAL'].includes(value.status) ||
      !Array.isArray(value.items) ||
      value.rowCount !== value.items.length
    ) {
      throw fail('ALERT_COLLECTION_MISMATCH', `Collection ${index + 1} is not the frozen input.`);
    }
    const expectedSources = collectionSources[index];
    const coverageNames = (value.sourceCoverage ?? []).map((entry) => entry.sourceName);
    if (
      !Array.isArray(value.sourceCoverage) ||
      JSON.stringify([...coverageNames].sort()) !== JSON.stringify([...expectedSources].sort()) ||
      (value.assignedSources &&
        JSON.stringify([...value.assignedSources].sort()) !==
          JSON.stringify([...expectedSources].sort()))
    ) {
      throw fail(
        'ALERT_SOURCE_COVERAGE',
        `Collection ${index + 1} has incomplete source coverage.`,
      );
    }
    for (const entry of value.sourceCoverage ?? []) {
      if (coverageBySource.has(entry.sourceName)) {
        throw fail('ALERT_COVERAGE_CONFLICT', 'A source is assigned twice.');
      }
      coverageBySource.set(entry.sourceName, entry);
    }
    for (const item of value.items) {
      if (
        !new RegExp(`^P${index + 1}-\\d{4}$`, 'u').test(String(item.candidateId)) ||
        !expectedSources.includes(item.sourceName) ||
        candidateById.has(item.candidateId)
      ) {
        throw fail('ALERT_CANDIDATE_CONFLICT', 'Candidate identifiers must be unique.');
      }
      candidateById.set(item.candidateId, item);
    }
  }
  const allIds = [...candidateById.keys()].sort();
  const frozenCandidates = new Map(
    (manifest.candidateIndex || []).map((entry) => [entry.candidateId, entry]),
  );
  if (
    manifest.candidateCount !== allIds.length ||
    manifest.candidateIndex?.length !== allIds.length ||
    frozenCandidates.size !== allIds.length ||
    allIds.some(
      (id) =>
        frozenCandidates.get(id)?.candidateSha256 !== candidateVersion(candidateById.get(id)) ||
        canonicalSha256(frozenCandidates.get(id)?.alertCandidate) !==
          canonicalSha256(toAlertCandidate(candidateById.get(id))),
    )
  ) {
    throw fail(
      'ALERT_CANDIDATE_INDEX_MISMATCH',
      'Manifest candidate index differs from raw collections.',
    );
  }
  const loadedReviews = reviewPaths.map(readJson);
  const verdicts = [];
  let latestReviewTime = 0;
  for (let index = 0; index < 3; index += 1) {
    const { value } = loadedReviews[index];
    const byId = validateReviewReport({
      value,
      role: index + 1,
      manifestId,
      manifestSha256: hash(manifestBytes),
      runId: sourceRunId,
      targetAsOfDate,
      candidateIndex: manifest.candidateIndex,
    });
    verdicts.push(byId);
    latestReviewTime = Math.max(latestReviewTime, Date.parse(value.reviewedAt));
  }
  const snapshotTime = Date.parse(currentState.capturedAt);
  if (snapshotTime > latestReviewTime || latestReviewTime - snapshotTime >= 6 * 60 * 60 * 1000) {
    throw fail('ALERT_CURRENT_STATE_STALE', 'Current DB/SENT snapshot is stale.');
  }
  const eligible = new Map(
    allIds.map((id) => [
      id,
      alertCandidateBlockReason(candidateById.get(id), targetAsOfDate, latestReviewTime),
    ]),
  );
  const acceptedIds = allIds.filter(
    (id) => verdicts.every((review) => review.get(id).verdict === 'PASS') && !eligible.get(id),
  );
  const accepted = acceptedIds.map((id) => toAlertCandidate(candidateById.get(id)));
  const bundleId = hash(
    JSON.stringify({
      sourceRunId,
      manifestId,
      collections: manifest.collections.map((entry) => [
        entry.partitionId,
        entry.fileId,
        entry.size,
        entry.sha256,
      ]),
      reviews: loadedReviews.map(({ bytes }) => hash(bytes)),
      acceptedIds,
    }),
  );
  const alert = {
    schemaVersion: ALERT_SCHEMA_VERSION,
    artifactType: ALERT_ARTIFACT_TYPE,
    runId: sourceRunId,
    targetAsOfDate,
    attempt,
    manifestId,
    bundleId,
    candidateCount: allIds.length,
    acceptedCount: accepted.length,
    candidates: accepted,
    excluded: allIds
      .filter((id) => !acceptedIds.includes(id))
      .map((candidateId) => ({
        candidateId,
        verdicts: verdicts.map((review) => review.get(candidateId).verdict),
        reason: eligible.get(candidateId) || 'REVIEW_NOT_UNANIMOUS',
      })),
    reviews: loadedReviews.map(({ bytes, value }, index) => ({
      role: index + 1,
      reviewedAt: value.reviewedAt,
      sha256: hash(bytes),
    })),
  };
  const productionPartitions = sourcePolicy.partitions.map((policy) => {
    const items = acceptedIds
      .map((id) => candidateById.get(id))
      .filter((item) => policy.sources.includes(item.sourceName))
      .map((item) => ({
        ...item,
        careerEvidence: evidenceText(item.careerEvidence),
        companySizeEvidence:
          item.companySizeEvidence == null ? null : evidenceText(item.companySizeEvidence),
      }));
    return {
      schemaVersion: '5.1',
      artifactType: 'CAREERGROUND_DISCOVERY_DELTA',
      workflowId: 'CG-JOBS-PROD-V5',
      targetAsOfDate,
      runGroupKey: `CG-${targetAsOfDate}`,
      timezone: 'Asia/Seoul',
      partitionId: policy.partitionId,
      attempt,
      bundleId,
      status: 'SUCCESS',
      sources: policy.sources,
      startedAt: loadedCollections[0].value.startedAt,
      completedAt: new Date(latestReviewTime).toISOString(),
      exportedAt: new Date(latestReviewTime).toISOString(),
      rowCount: items.length,
      items,
      excluded: [],
      uncertain: [],
      sourceCoverage: policy.sources.map((sourceName) => {
        const original = coverageBySource.get(sourceName);
        return original
          ? { sourceName, status: original.status, notes: String(original.notes ?? '') }
          : {
              sourceName,
              status: 'BLOCKED',
              notes: 'DISABLED_BY_USER_POLICY: excluded from discovery',
            };
      }),
      qualityGates: { overall: 'PASS_WITH_PARTIAL_COVERAGE' },
      blockingErrors: [],
      productionDatabaseChanged: false,
      slackSent: false,
    };
  });
  if (
    productionPartitions.reduce((sum, partition) => sum + partition.rowCount, 0) !== accepted.length
  ) {
    throw fail('ALERT_SOURCE_OWNERSHIP', 'A source has no production partition.');
  }
  return { alert, productionPartitions };
}

export function writeAlertReady(outputDir, result) {
  const destination = resolve(outputDir);
  if (existsSync(destination))
    throw fail('ALERT_OUTPUT_EXISTS', 'Output directory must not exist.');
  mkdirSync(dirname(destination), { recursive: true });
  const stage = mkdtempSync(`${destination}.tmp-`);
  try {
    writeFileSync(resolve(stage, 'alert-ready.json'), `${JSON.stringify(result.alert, null, 2)}\n`);
    const fileNames =
      result.alert.acceptedCount === 0
        ? []
        : result.productionPartitions.map((partition) => {
            const name = `careerground-partition-${partition.partitionId}-${result.alert.targetAsOfDate}.json`;
            writeFileSync(resolve(stage, name), `${JSON.stringify(partition, null, 2)}\n`);
            return name;
          });
    if (fileNames.length)
      validateDiscoveryBundle({
        partitionPaths: fileNames.map((name) => resolve(stage, name)),
        targetAsOfDate: result.alert.targetAsOfDate,
        sourcePolicy,
        runId: `${result.alert.runId}-discovery`,
      });
    renameSync(stage, destination);
    return fileNames.map((name) => resolve(destination, name));
  } catch (error) {
    rmSync(stage, { recursive: true, force: true });
    throw error;
  }
}

function argsFrom(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2)
    result[argv[index].slice(2)] = argv[index + 1];
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = argsFrom(process.argv.slice(2));
    const result = buildAlertReady({
      manifestId: args['manifest-id'],
      manifestPath: args.manifest,
      collectionPaths: [1, 2, 3, 4, 5].map((n) => args[`collection-${n}`]),
      reviewPaths: [1, 2, 3].map((n) => args[`review-${n}`]),
      currentStatePath: args['current-state'],
      targetAsOfDate: args.date,
      attempt: Number(args.attempt || 1),
    });
    writeAlertReady(args.output, result);
    process.stdout.write(
      `${JSON.stringify({
        status: result.alert.acceptedCount ? 'READY' : 'NO_ELIGIBLE_JOBS',
        bundleId: result.alert.bundleId,
        candidateCount: result.alert.candidateCount,
        acceptedCount: result.alert.acceptedCount,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ status: 'BLOCKED', code: error.code || 'ALERT_BUILD_FAILED', message: error.message })}\n`,
    );
    process.exitCode = 1;
  }
}
