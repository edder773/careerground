#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { canonicalSha256 } from './canonical-json.mjs';
import { candidateVersion, toAlertCandidate, validateReviewReport } from './alert-ready.mjs';

const fail = (code, message) => Object.assign(new Error(message), { code });
const sha256 = (value) => /^[a-f0-9]{64}$/u.test(String(value));
const iso = (value) =>
  typeof value === 'string' &&
  /(Z|[+-]\d\d:\d\d)$/u.test(value) &&
  Number.isFinite(Date.parse(value));
const rawHash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const baselineFileId = '1l08BzJYaFzrDWg4d3OV9b3DPdDpU_8Cc';
const baselineSha256 = '7773b227a6c37335282fbeea48f479a294e8f71585b5dbc5644aaf5f445cfa57';
const collectionSources = [
  ['JobKorea', 'Wanted', 'Catch'],
  ['Superookie', 'Work24', 'Saramin'],
  ['Jumpit', 'Inthiswork', 'Remember Career'],
  ['RocketPunch', 'Incruit', 'LinkedIn Korea'],
  ['Jasoseol', 'Linkareer', 'JOB-ALIO'],
];

function readRawJson(path) {
  const bytes = readFileSync(resolve(path));
  return { bytes, value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/u, '')) };
}

function baselineMatches(baseline) {
  if (!baseline || baseline.fileId !== baselineFileId) return false;
  if (
    (baseline.rowCount !== undefined && baseline.rowCount !== 392) ||
    (baseline.expectedRowCount !== undefined && baseline.expectedRowCount !== 392) ||
    (baseline.actualRowCount !== undefined && baseline.actualRowCount !== 392) ||
    (baseline.expectedSha256 !== undefined && baseline.expectedSha256 !== baselineSha256) ||
    (baseline.actualSha256 !== undefined && baseline.actualSha256 !== baselineSha256)
  ) {
    return false;
  }
  return (
    baseline.rowCount === 392 ||
    (baseline.status === 'VERIFIED' &&
      baseline.expectedRowCount === 392 &&
      baseline.actualRowCount === 392 &&
      baseline.expectedSha256 === baselineSha256 &&
      baseline.actualSha256 === baselineSha256)
  );
}

export function freezeRunInputs({
  targetAsOfDate,
  attempt = 1,
  collections,
  currentState,
  frozenAt,
}) {
  const runId = `CG-${targetAsOfDate}-A${attempt}`;
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(targetAsOfDate) ||
    attempt !== 1 ||
    !iso(frozenAt) ||
    collections?.length !== 5 ||
    !currentState?.path ||
    !currentState.fileId
  ) {
    throw fail('INPUT_NOT_READY', 'Regular run identity or five input references are missing.');
  }
  const candidateIds = new Set();
  const candidateIndex = [];
  const frozenCollections = collections.map((reference, index) => {
    const { bytes, value } = readRawJson(reference.path);
    const expectedSources = collectionSources[index];
    if (
      !reference.fileId ||
      value.runId !== runId ||
      value.targetAsOfDate !== targetAsOfDate ||
      value.attempt !== attempt ||
      value.partitionId !== index + 1 ||
      !['COMPLETE', 'PARTIAL'].includes(value.status) ||
      !baselineMatches(value.baseline) ||
      !Array.isArray(value.items) ||
      value.rowCount !== value.items.length ||
      JSON.stringify([...(value.assignedSources || [])].sort()) !==
        JSON.stringify([...expectedSources].sort()) ||
      JSON.stringify([...(value.sourceCoverage || []).map((entry) => entry.sourceName)].sort()) !==
        JSON.stringify([...expectedSources].sort())
    ) {
      throw fail('INPUT_NOT_READY', `Collection P${index + 1} is incomplete or mismatched.`);
    }
    for (const item of value.items) {
      if (
        !new RegExp(`^P${index + 1}-\\d{4}$`, 'u').test(String(item.candidateId)) ||
        !expectedSources.includes(item.sourceName) ||
        candidateIds.has(item.candidateId)
      ) {
        throw fail('INPUT_NOT_READY', 'Candidate identity or source ownership conflicts.');
      }
      candidateIds.add(item.candidateId);
      candidateIndex.push({
        candidateId: item.candidateId,
        candidateSha256: candidateVersion(item),
        alertCandidate: toAlertCandidate(item),
      });
    }
    return {
      partitionId: index + 1,
      fileId: reference.fileId,
      version: reference.version ?? null,
      fileName: reference.fileName,
      size: bytes.length,
      sha256: rawHash(bytes),
      rowCount: value.rowCount,
    };
  });
  const { bytes: stateBytes, value: state } = readRawJson(currentState.path);
  if (
    state.runId !== runId ||
    state.complete !== true ||
    state.truncated !== false ||
    !iso(state.capturedAt) ||
    Date.parse(state.capturedAt) > Date.parse(frozenAt) ||
    Date.parse(frozenAt) - Date.parse(state.capturedAt) >= 6 * 60 * 60 * 1000 ||
    ![
      'jobs',
      'slack_digest_items',
      'slack_digest_job_reservations',
      'slack_digest_deliveries',
    ].every((table) => Array.isArray(state.tables?.[table]))
  ) {
    throw fail('INPUT_NOT_READY', 'Current DB/SENT snapshot is missing, partial, or stale.');
  }
  candidateIndex.sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  return {
    runId,
    targetAsOfDate,
    attempt,
    runKind: 'REGULAR',
    frozenAt,
    candidateCount: candidateIndex.length,
    candidateIndex,
    collections: frozenCollections,
    currentState: {
      fileId: currentState.fileId,
      version: currentState.version ?? null,
      fileName: currentState.fileName,
      size: stateBytes.length,
      sha256: rawHash(stateBytes),
    },
  };
}

export function collectionIdentity(collections) {
  if (!Array.isArray(collections) || collections.length !== 5) {
    throw fail('INPUT_NOT_READY', 'Exactly five frozen collections are required.');
  }
  const sorted = [...collections].sort((left, right) => left.partitionId - right.partitionId);
  if (
    sorted.some(
      (entry, index) =>
        entry.partitionId !== index + 1 ||
        !entry.fileId ||
        !Number.isInteger(entry.size) ||
        entry.size < 1 ||
        !sha256(entry.sha256),
    )
  ) {
    throw fail('INPUT_NOT_READY', 'Collection identity is incomplete.');
  }
  return canonicalSha256(
    sorted.map(({ partitionId, fileId, size, sha256: digest }) => ({
      partitionId,
      fileId,
      size,
      sha256: digest,
    })),
  );
}

export function createRunLedger({
  manifest,
  manifestId,
  manifestSha256,
  createdAt,
  scheduledDispatchAt,
  scheduledCollectAt,
  reviewThreads,
}) {
  if (
    !manifest ||
    !manifestId ||
    !sha256(manifestSha256) ||
    !iso(createdAt) ||
    !iso(scheduledDispatchAt) ||
    !iso(scheduledCollectAt) ||
    ![1, 2, 3].every(
      (role) =>
        typeof reviewThreads?.[role] === 'string' && /^[a-f0-9-]{36}$/u.test(reviewThreads[role]),
    )
  ) {
    throw fail('LEDGER_IDENTITY_INVALID', 'Manifest identity and scheduled times are required.');
  }
  const { runId, targetAsOfDate, attempt, collections } = manifest;
  if (runId !== `CG-${targetAsOfDate}-A${attempt}` || attempt !== 1) {
    throw fail('LEDGER_IDENTITY_INVALID', 'Regular HQ runs must use the same-day A1 identity.');
  }
  const identity = collectionIdentity(collections);
  const candidateCount = collections.reduce((sum, entry) => sum + entry.rowCount, 0);
  if (!Number.isInteger(candidateCount) || candidateCount < 0) {
    throw fail('INPUT_NOT_READY', 'Collection row counts are missing.');
  }
  if (
    !manifest.currentState?.fileId ||
    !sha256(manifest.currentState.sha256) ||
    manifest.candidateCount !== candidateCount ||
    manifest.candidateIndex?.length !== candidateCount ||
    new Set(manifest.candidateIndex.map((entry) => entry.candidateId)).size !== candidateCount
  ) {
    throw fail(
      'LEDGER_IDENTITY_INVALID',
      'Manifest candidate index or current state is incomplete.',
    );
  }
  return {
    schemaVersion: '1.0',
    artifactType: 'CAREERGROUND_HQ_RUN_LEDGER',
    runId,
    runKind: 'REGULAR',
    targetAsOfDate,
    attempt,
    inputManifestId: manifestId,
    inputManifestSha256: manifestSha256,
    collectionIdentity: identity,
    candidateCount,
    candidateIndexSha256: canonicalSha256(manifest.candidateIndex),
    currentStateId: manifest.currentState.fileId,
    currentStateSha256: manifest.currentState.sha256,
    createdAt,
    scheduledDispatchAt,
    scheduledCollectAt,
    observedStage: 'INPUT_READY',
    requests: Object.fromEntries(
      [1, 2, 3].map((role) => [
        role,
        {
          role,
          threadId: reviewThreads[role],
          stageKey: `${runId}/${manifestId}/${role}/REVIEW`,
          expectedResultName: `${runId}-R${role}.json`,
          status: 'UNSENT',
          intentAt: null,
          userMessageId: null,
          requestedAt: null,
          review: null,
        },
      ]),
    ),
  };
}

export function verifyFrozenReviewFile({ manifestPath, manifestId, reviewPath, role }) {
  const { bytes: manifestBytes, value: manifest } = readRawJson(manifestPath);
  const { bytes: reviewBytes, value: review } = readRawJson(reviewPath);
  if (
    ![1, 2, 3].includes(role) ||
    manifest.attempt !== 1 ||
    manifest.runId !== `CG-${manifest.targetAsOfDate}-A1` ||
    !Array.isArray(manifest.candidateIndex)
  ) {
    throw fail('LEDGER_REVIEW_CONFLICT', 'Manifest or role is invalid.');
  }
  const decisions = validateReviewReport({
    value: review,
    role,
    manifestId,
    manifestSha256: rawHash(manifestBytes),
    runId: manifest.runId,
    targetAsOfDate: manifest.targetAsOfDate,
    candidateIndex: manifest.candidateIndex,
  });
  return {
    role,
    runId: manifest.runId,
    inputManifestId: manifestId,
    size: reviewBytes.length,
    sha256: rawHash(reviewBytes),
    reviewedAt: review.reviewedAt,
    passCount: [...decisions.values()].filter((entry) => entry.verdict === 'PASS').length,
    holdCount: [...decisions.values()].filter((entry) => entry.verdict === 'HOLD').length,
    rejectCount: [...decisions.values()].filter((entry) => entry.verdict === 'REJECT').length,
  };
}

export function transitionRunLedger(ledger, event) {
  if (
    !ledger ||
    ledger.artifactType !== 'CAREERGROUND_HQ_RUN_LEDGER' ||
    event?.runId !== ledger.runId ||
    event?.inputManifestId !== ledger.inputManifestId ||
    !iso(event?.observedAt)
  ) {
    throw fail('LEDGER_EVENT_INVALID', 'Event does not match the frozen run.');
  }
  const role = Number(event.role);
  const prior = ledger.requests?.[role];
  if (!prior || event.stageKey !== prior.stageKey) {
    throw fail('LEDGER_EVENT_INVALID', 'Event role or stage key is invalid.');
  }
  const next = JSON.parse(JSON.stringify(ledger));
  const request = next.requests[role];
  switch (event.type) {
    case 'DISPATCH_INTENT':
      if (request.status === 'UNSENT') {
        request.status = 'INTENT_RECORDED';
        request.intentAt = event.observedAt;
      }
      break;
    case 'CHAT_MESSAGE_VERIFIED':
      if (
        request.status === 'UNSENT' ||
        !event.userMessageId ||
        event.threadId !== request.threadId ||
        (request.userMessageId && request.userMessageId !== event.userMessageId)
      ) {
        throw fail('LEDGER_DISPATCH_UNCERTAIN', 'Message identity cannot be reconciled.');
      }
      request.status = request.review ? 'REVIEWED' : 'REQUESTED';
      request.userMessageId = event.userMessageId;
      request.requestedAt ??= event.observedAt;
      break;
    case 'DISPATCH_UNCERTAIN':
      if (request.status === 'UNSENT' || request.status === 'REVIEWED') {
        throw fail(
          'LEDGER_EVENT_INVALID',
          'Only an unresolved intent or request can be uncertain.',
        );
      }
      request.status = 'DISPATCH_UNCERTAIN';
      request.uncertainReason = String(event.reason || 'NO_CONFIRMED_RESPONSE');
      break;
    case 'REVIEW_FILE_VERIFIED':
      if (
        request.status === 'UNSENT' ||
        !event.fileId ||
        !sha256(event.sha256) ||
        !Number.isInteger(event.size) ||
        event.size < 1 ||
        (request.review &&
          (request.review.fileId !== event.fileId || request.review.sha256 !== event.sha256))
      ) {
        throw fail('LEDGER_REVIEW_CONFLICT', 'Review file identity is missing or changed.');
      }
      request.review = {
        fileId: event.fileId,
        size: event.size,
        sha256: event.sha256,
        observedAt: event.observedAt,
      };
      request.status = 'REVIEWED';
      break;
    default:
      throw fail('LEDGER_EVENT_INVALID', 'Unsupported ledger event.');
  }
  next.observedStage = Object.values(next.requests).every((entry) => entry.status === 'REVIEWED')
    ? 'REVIEWED'
    : Object.values(next.requests).some((entry) => entry.status !== 'UNSENT')
      ? 'REVIEW_REQUESTED'
      : 'INPUT_READY';
  return next;
}

export function assessRunLedger(ledger) {
  const requests = Object.values(ledger.requests || {});
  if (requests.length !== 3) throw fail('LEDGER_IDENTITY_INVALID', 'Three roles are required.');
  const reviewedRoles = requests
    .filter((entry) => entry.status === 'REVIEWED')
    .map((entry) => entry.role)
    .sort();
  const missingRoles = requests
    .filter((entry) => entry.status !== 'REVIEWED')
    .map((entry) => ({
      role: entry.role,
      status: entry.status,
      userMessageId: entry.userMessageId,
    }));
  return {
    runId: ledger.runId,
    inputManifestId: ledger.inputManifestId,
    status: missingRoles.length ? 'REVIEW_INCOMPLETE' : 'REVIEWS_READY',
    reviewedRoles,
    missingRoles,
    shouldRetryAutomatically: false,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode, inputPath, outputPath] = process.argv.slice(2);
    const input = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
    const result =
      mode === 'freeze'
        ? freezeRunInputs(input)
        : mode === 'verify-review'
          ? verifyFrozenReviewFile(input)
          : mode === 'create'
            ? createRunLedger(input)
            : mode === 'transition'
              ? transitionRunLedger(input.ledger, input.event)
              : mode === 'assess'
                ? assessRunLedger(input)
                : null;
    if (!result) throw fail('LEDGER_ARGUMENT_INVALID', 'Use create, transition, or assess.');
    if (outputPath) writeFileSync(resolve(outputPath), `${JSON.stringify(result, null, 2)}\n`);
    else process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ code: error.code || 'LEDGER_FAILED', message: error.message })}\n`,
    );
    process.exitCode = 1;
  }
}
