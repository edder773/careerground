import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildAlertReady,
  candidateVersion,
  toAlertCandidate,
  writeAlertReady,
} from './alert-ready.mjs';

const date = '2026-09-28';
const runId = `CG-${date}-A1`;
const manifestId = 'frozen-manifest-test';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const write = (dir, name, value) => {
  const path = join(dir, name);
  writeFileSync(path, `${JSON.stringify(value)}\n`);
  return path;
};

function fixture(verdicts = ['PASS', 'PASS', 'PASS']) {
  const dir = mkdtempSync(join(tmpdir(), 'cg-alert-'));
  const item = {
    candidateId: 'P1-0001',
    sourceName: 'JobKorea',
    sourceUrl: 'https://example.test/jobs/1',
    sourcePostingId: '1',
    companyName: '테스트 회사',
    title: '신입 백엔드',
    category: '백엔드',
    companySize: 'UNCLASSIFIED',
    companySizeEvidence: null,
    careerScope: 'NEW_GRAD_ONLY',
    careerEvidence: {
      url: 'https://example.test/jobs/1',
      excerpt: '신입',
      checkedAt: '2026-09-28T18:05:00+09:00',
    },
    employmentType: 'FULL_TIME',
    region: '서울',
    summary: '신입 백엔드 개발',
    techStack: [],
    publishedAt: '2026-09-28T09:00:00+09:00',
    applicationStartAt: '2026-09-28T09:00:00+09:00',
    deadlineAt: '2026-10-01T18:00:00+09:00',
    rolling: false,
    status: 'ACTIVE',
    lastVerifiedAt: '2026-09-28T18:05:00+09:00',
  };
  const collectionPaths = [];
  const collections = [];
  for (let partitionId = 1; partitionId <= 5; partitionId += 1) {
    const sources = [
      ['JobKorea', 'Wanted', 'Catch'],
      ['Superookie', 'Work24', 'Saramin'],
      ['Jumpit', 'Inthiswork', 'Remember Career'],
      ['RocketPunch', 'Incruit', 'LinkedIn Korea'],
      ['Jasoseol', 'Linkareer', 'JOB-ALIO'],
    ];
    const value = {
      runId,
      targetAsOfDate: date,
      attempt: 1,
      partitionId,
      status: 'COMPLETE',
      startedAt: '2026-09-28T18:00:00+09:00',
      assignedSources: sources[partitionId - 1],
      rowCount: partitionId === 1 ? 1 : 0,
      items: partitionId === 1 ? [item] : [],
      sourceCoverage: sources[partitionId - 1].map((sourceName) => ({
        sourceName,
        status: 'COMPLETE',
      })),
    };
    const path = write(dir, `collection-${partitionId}.json`, value);
    const bytes = readFileSync(path);
    collectionPaths.push(path);
    collections.push({
      partitionId,
      fileId: `file-${partitionId}`,
      size: bytes.length,
      sha256: sha(bytes),
    });
  }
  const currentStatePath = write(dir, 'current-state.json', {
    runId,
    capturedAt: '2026-09-28T19:55:00+09:00',
    complete: true,
    truncated: false,
    tables: {
      jobs: [],
      slack_digest_items: [],
      slack_digest_job_reservations: [],
      slack_digest_deliveries: [],
    },
  });
  const stateBytes = readFileSync(currentStatePath);
  const manifestPath = write(dir, 'manifest.json', {
    runId,
    targetAsOfDate: date,
    attempt: 1,
    collections,
    candidateCount: 1,
    candidateIndex: [
      {
        candidateId: 'P1-0001',
        candidateSha256: candidateVersion(item),
        alertCandidate: toAlertCandidate(item),
      },
    ],
    currentState: { fileId: 'current-state-id', size: stateBytes.length, sha256: sha(stateBytes) },
  });
  const reviewPaths = verdicts.map((verdict, index) =>
    write(dir, `review-${index + 1}.json`, {
      schemaVersion: '2.1',
      runId,
      inputManifestId: manifestId,
      inputManifestSha256: sha(readFileSync(manifestPath)),
      role: index + 1,
      stage: 'REVIEW',
      status: 'COMPLETE',
      blockingErrors: [],
      reviewedAt: '2026-09-28T20:05:00+09:00',
      decisions: [
        {
          candidateId: 'P1-0001',
          candidateSha256: candidateVersion(item),
          verdict,
          reason: '직접 확인',
          ...(verdict === 'PASS'
            ? {
                alertCandidate: toAlertCandidate(item),
                evidence: [{ source: '원문 또는 원장', checkedAt: '2026-09-28T20:05:00+09:00' }],
              }
            : {}),
        },
      ],
    }),
  );
  return { dir, manifestPath, currentStatePath, collectionPaths, reviewPaths, item };
}

function build(input) {
  return buildAlertReady({
    manifestId,
    manifestPath: input.manifestPath,
    currentStatePath: input.currentStatePath,
    collectionPaths: input.collectionPaths,
    reviewPaths: input.reviewPaths,
    targetAsOfDate: date,
  });
}

describe('one reviewed alert contract', () => {
  it('makes one minimal ready candidate and deterministic production adapter', () => {
    const input = fixture();
    const result = build(input);
    expect(result.alert).toMatchObject({
      candidateCount: 1,
      acceptedCount: 1,
      candidates: [{ candidateId: 'P1-0001', companyName: '테스트 회사' }],
    });
    expect(result.alert.candidates[0]).not.toHaveProperty('summary');
    expect(result.productionPartitions.map((entry) => entry.rowCount)).toEqual([1, 0, 0]);
    expect(result.productionPartitions[0].items[0].careerEvidence).toBe(
      JSON.stringify(input.item.careerEvidence),
    );
    expect(result.productionPartitions[0].items[0].companySizeEvidence).toBeNull();
    expect(result.productionPartitions.map((entry) => entry.bundleId)).toEqual([
      result.alert.bundleId,
      result.alert.bundleId,
      result.alert.bundleId,
    ]);
    expect(writeAlertReady(join(input.dir, 'output'), result)).toHaveLength(3);
  });

  it('excludes a candidate when even one review holds it', () => {
    const input = fixture(['PASS', 'HOLD', 'PASS']);
    const result = build(input);
    expect(result.alert.acceptedCount).toBe(0);
    expect(result.alert.excluded).toEqual([
      {
        candidateId: 'P1-0001',
        verdicts: ['PASS', 'HOLD', 'PASS'],
        reason: 'REVIEW_NOT_UNANIMOUS',
      },
    ]);
    expect(writeAlertReady(join(input.dir, 'empty-output'), result)).toHaveLength(0);
  });

  it('rejects a changed frozen collection and a review of another manifest', () => {
    const input = fixture();
    writeFileSync(input.collectionPaths[0], JSON.stringify({ changed: true }));
    expect(() => build(input)).toThrow(
      expect.objectContaining({ code: 'ALERT_COLLECTION_MISMATCH' }),
    );
    const second = fixture();
    const review = JSON.parse(readFileSync(second.reviewPaths[1], 'utf8'));
    writeFileSync(second.reviewPaths[1], JSON.stringify({ ...review, inputManifestId: 'other' }));
    expect(() => build(second)).toThrow(expect.objectContaining({ code: 'ALERT_REVIEW_MISMATCH' }));
  });

  it('rejects incomplete source coverage and expired candidates', () => {
    const first = fixture();
    const collection = JSON.parse(readFileSync(first.collectionPaths[0], 'utf8'));
    collection.sourceCoverage.pop();
    writeFileSync(first.collectionPaths[0], `${JSON.stringify(collection)}\n`);
    const manifest = JSON.parse(readFileSync(first.manifestPath, 'utf8'));
    const bytes = readFileSync(first.collectionPaths[0]);
    manifest.collections[0].size = bytes.length;
    manifest.collections[0].sha256 = sha(bytes);
    writeFileSync(first.manifestPath, `${JSON.stringify(manifest)}\n`);
    expect(() => build(first)).toThrow(expect.objectContaining({ code: 'ALERT_SOURCE_COVERAGE' }));

    const second = fixture();
    const next = JSON.parse(readFileSync(second.collectionPaths[0], 'utf8'));
    next.items[0].deadlineAt = '2026-09-28T20:00:00+09:00';
    writeFileSync(second.collectionPaths[0], `${JSON.stringify(next)}\n`);
    const frozen = JSON.parse(readFileSync(second.manifestPath, 'utf8'));
    const changed = readFileSync(second.collectionPaths[0]);
    frozen.collections[0].size = changed.length;
    frozen.collections[0].sha256 = sha(changed);
    frozen.candidateIndex[0].candidateSha256 = candidateVersion(next.items[0]);
    frozen.candidateIndex[0].alertCandidate = toAlertCandidate(next.items[0]);
    writeFileSync(second.manifestPath, `${JSON.stringify(frozen)}\n`);
    const review = JSON.parse(readFileSync(second.reviewPaths[0], 'utf8'));
    for (const path of second.reviewPaths) {
      const value = JSON.parse(readFileSync(path, 'utf8'));
      value.inputManifestSha256 = sha(readFileSync(second.manifestPath));
      value.decisions[0].candidateSha256 = candidateVersion(next.items[0]);
      value.decisions[0].alertCandidate = toAlertCandidate(next.items[0]);
      writeFileSync(path, `${JSON.stringify(value)}\n`);
    }
    expect(review.decisions[0].candidateSha256).not.toBe(candidateVersion(next.items[0]));
    const result = build(second);
    expect(result.alert.acceptedCount).toBe(0);
    expect(result.alert.excluded[0].reason).toBe('EXPIRED');
  });

  it('blocks a PASS that rewrites the shared alert candidate or omits the input version', () => {
    const input = fixture();
    const review = JSON.parse(readFileSync(input.reviewPaths[0], 'utf8'));
    review.decisions[0].alertCandidate.title = '다른 직무';
    writeFileSync(input.reviewPaths[0], `${JSON.stringify(review)}\n`);
    expect(() => build(input)).toThrow(expect.objectContaining({ code: 'ALERT_REVIEW_DECISIONS' }));
    review.decisions[0].alertCandidate.title = input.item.title;
    delete review.decisions[0].candidateSha256;
    writeFileSync(input.reviewPaths[0], `${JSON.stringify(review)}\n`);
    expect(() => build(input)).toThrow(expect.objectContaining({ code: 'ALERT_REVIEW_DECISIONS' }));
    review.decisions[0].candidateSha256 = candidateVersion(input.item);
    delete review.decisions[0].alertCandidate;
    writeFileSync(input.reviewPaths[0], `${JSON.stringify(review)}\n`);
    expect(() => build(input)).toThrow(expect.objectContaining({ code: 'ALERT_REVIEW_DECISIONS' }));
  });

  it('keeps a valid candidate when another verified candidate has expired', () => {
    const input = fixture();
    const collection = JSON.parse(readFileSync(input.collectionPaths[0], 'utf8'));
    const expired = {
      ...input.item,
      candidateId: 'P1-0002',
      sourcePostingId: '2',
      sourceUrl: 'https://example.test/jobs/2',
      deadlineAt: '2026-09-28T19:59:00+09:00',
    };
    collection.items.push(expired);
    collection.rowCount = 2;
    writeFileSync(input.collectionPaths[0], `${JSON.stringify(collection)}\n`);
    const manifest = JSON.parse(readFileSync(input.manifestPath, 'utf8'));
    const bytes = readFileSync(input.collectionPaths[0]);
    manifest.collections[0].size = bytes.length;
    manifest.collections[0].sha256 = sha(bytes);
    manifest.candidateCount = 2;
    manifest.candidateIndex.push({
      candidateId: expired.candidateId,
      candidateSha256: candidateVersion(expired),
      alertCandidate: toAlertCandidate(expired),
    });
    writeFileSync(input.manifestPath, `${JSON.stringify(manifest)}\n`);
    for (const path of input.reviewPaths) {
      const review = JSON.parse(readFileSync(path, 'utf8'));
      review.inputManifestSha256 = sha(readFileSync(input.manifestPath));
      review.decisions.push({
        candidateId: expired.candidateId,
        candidateSha256: candidateVersion(expired),
        verdict: 'PASS',
        reason: '직접 확인',
        alertCandidate: toAlertCandidate(expired),
        evidence: [{ source: expired.sourceUrl }],
      });
      writeFileSync(path, `${JSON.stringify(review)}\n`);
    }
    const result = build(input);
    expect(result.alert.acceptedCount).toBe(1);
    expect(result.alert.candidates[0].candidateId).toBe('P1-0001');
    expect(result.alert.excluded[0]).toMatchObject({ candidateId: 'P1-0002', reason: 'EXPIRED' });
  });
});
