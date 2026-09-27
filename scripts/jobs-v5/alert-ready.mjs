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

function readJson(path) {
  const bytes = readFileSync(resolve(path));
  return { bytes, value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/u, '')) };
}

export function buildAlertReady({
  manifestId,
  manifestPath,
  collectionPaths,
  reviewPaths,
  targetAsOfDate,
  attempt = 1,
}) {
  if (!manifestId || !/^\d{4}-\d{2}-\d{2}$/u.test(targetAsOfDate)) {
    throw fail('ALERT_IDENTITY_INVALID', 'manifestId and targetAsOfDate are required.');
  }
  if (collectionPaths?.length !== 5 || reviewPaths?.length !== 3) {
    throw fail('ALERT_INPUT_COUNT', 'Exactly five collections and three reviews are required.');
  }
  const { value: manifest } = readJson(manifestPath);
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
  const loadedReviews = reviewPaths.map(readJson);
  const verdicts = [];
  let latestReviewTime = 0;
  for (let index = 0; index < 3; index += 1) {
    const { value } = loadedReviews[index];
    if (
      value.runId !== sourceRunId ||
      value.inputManifestId !== manifestId ||
      Number(value.role) !== index + 1 ||
      value.stage !== 'REVIEW' ||
      value.status !== 'COMPLETE' ||
      value.blockingErrors?.length ||
      dateInSeoul(value.reviewedAt) !== targetAsOfDate ||
      !Array.isArray(value.decisions) ||
      value.decisions.length !== allIds.length
    ) {
      throw fail('ALERT_REVIEW_MISMATCH', `Review ${index + 1} is incomplete or stale.`);
    }
    const byId = new Map(value.decisions.map((decision) => [decision.candidateId, decision]));
    if (
      byId.size !== allIds.length ||
      allIds.some(
        (id) =>
          !byId.has(id) ||
          !['PASS', 'HOLD', 'REJECT'].includes(byId.get(id).verdict) ||
          !String(byId.get(id).reason || '').trim(),
      )
    ) {
      throw fail('ALERT_REVIEW_DECISIONS', `Review ${index + 1} must decide every candidate.`);
    }
    verdicts.push(byId);
    latestReviewTime = Math.max(latestReviewTime, Date.parse(value.reviewedAt));
  }
  const acceptedIds = allIds.filter((id) =>
    verdicts.every((review) => review.get(id).verdict === 'PASS'),
  );
  const accepted = acceptedIds.map((id) => {
    const item = candidateById.get(id);
    if (
      item.status !== 'ACTIVE' ||
      !['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE'].includes(item.careerScope) ||
      item.rolling === true ||
      !item.deadlineAt ||
      dateInSeoul(item.lastVerifiedAt) !== targetAsOfDate ||
      new Date(item.deadlineAt).getTime() <= latestReviewTime ||
      latestReviewTime - Date.parse(item.lastVerifiedAt) >= 6 * 60 * 60 * 1000
    ) {
      throw fail('ALERT_CANDIDATE_NOT_READY', `Candidate ${id} is not eligible for a dated alert.`);
    }
    for (const field of [
      'sourceName',
      'sourceUrl',
      'companyName',
      'title',
      'category',
      'region',
      'summary',
    ]) {
      if (!String(item[field] || '').trim()) {
        throw fail('ALERT_REQUIRED_FIELD', `Candidate ${id} lacks ${field}.`);
      }
    }
    if (!evidenceText(item.careerEvidence).trim()) {
      throw fail('ALERT_EVIDENCE_MISSING', `Candidate ${id} lacks career evidence.`);
    }
    return {
      candidateId: id,
      companyName: item.companyName,
      title: item.title,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      deadlineAt: item.deadlineAt,
      careerScope: item.careerScope,
      status: 'ACTIVE',
      rolling: false,
      lastVerifiedAt: item.lastVerifiedAt,
    };
  });
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
    const fileNames = result.productionPartitions.map((partition) => {
      const name = `careerground-partition-${partition.partitionId}-${result.alert.targetAsOfDate}.json`;
      writeFileSync(resolve(stage, name), `${JSON.stringify(partition, null, 2)}\n`);
      return name;
    });
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
      targetAsOfDate: args.date,
      attempt: Number(args.attempt || 1),
    });
    writeAlertReady(args.output, result);
    process.stdout.write(
      `${JSON.stringify({
        status: 'READY',
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
