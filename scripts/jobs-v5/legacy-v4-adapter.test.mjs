import { Buffer } from 'node:buffer';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadExplicitPartition } from './adapter.mjs';
import { canonicalizeHttpUrl, rawSha256, sha256 } from './canonical-json.mjs';
import { createExecutionIdentity, transition } from './contracts.mjs';
import {
  legacyArtifactCanonicalSha256,
  legacyBucketForId,
  legacyCanonicalSha256,
  loadLegacyV4Bundle,
  normalizeLegacyJob,
  writeLegacyV4Conversion,
} from './legacy-v4-adapter.mjs';

const targetAsOfDate = '2026-08-28';
const legacyRunGroupKey = `${targetAsOfDate}:${'a'.repeat(16)}`;
const baselineHash = 'a'.repeat(64);

function identity() {
  return transition(
    createExecutionIdentity({
      targetAsOfDate,
      attempt: 1,
      mode: 'DRY_RUN',
      nonce: 'legacy01',
      now: new Date('2026-08-28T09:00:00.000Z'),
    }),
    'RUNNING',
  );
}

function jobForBucket(bucket) {
  for (let index = 1; index < 1000; index += 1) {
    const sourceUrl = canonicalizeHttpUrl(`https://careers.example.test/jobs/${bucket}-${index}`);
    const id = `job-${sha256(sourceUrl).slice(0, 24)}`;
    if (legacyBucketForId(id) !== bucket) continue;
    return {
      id,
      source_url: sourceUrl,
      source_name: `Fixture Source ${bucket + 1}`,
      source_posting_id: `${bucket}-${index}`,
      fingerprint: `fixture-fingerprint-${bucket}`,
      company_name: `비식별 회사 ${bucket + 1}`,
      company_size: 'LARGE',
      company_size_evidence: '비식별 근거',
      title: `신입 개발자 ${bucket + 1}`,
      category: '백엔드',
      career_scope: 'NEW_GRAD_ONLY',
      career_evidence: '신입 지원 가능',
      employment_type: 'FULL_TIME',
      region: '서울',
      remote: 0,
      tech_stack: '["Java"]',
      published_at: '2026-08-28T00:00:00.000Z',
      application_start_at: '2026-08-28T00:00:00.000Z',
      deadline_at: '2026-09-30T14:59:59.000Z',
      rolling: 0,
      summary: '비식별 fixture',
      status: 'ACTIVE',
      collected_at: '2026-08-28T09:00:00.000Z',
      last_verified_at: '2026-08-28T09:01:00.000Z',
      created_at: '2026-08-28T09:01:00.000Z',
      updated_at: '2026-08-28T09:01:00.000Z',
    };
  }
  throw new Error(`Could not create fixture bucket ${bucket}.`);
}

function writeArtifact(path, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path, raw);
  return Buffer.from(raw);
}

function buildBundle() {
  const directory = mkdtempSync(join(tmpdir(), 'cg-v4-bundle-'));
  const finalPath = join(directory, `careerground-jobs-live-${targetAsOfDate}-final.json`);
  const auditPath = join(directory, `careerground-merge-audit-${targetAsOfDate}.json`);
  const items = [0, 1, 2].map(jobForBucket);
  const final = {
    version: '1.0',
    timezone: 'Asia/Seoul',
    project: 'careerground-workspace',
    databaseBinding: 'DB',
    table: 'jobs',
    exportedAt: '2026-08-28T18:10:00+09:00',
    rowCount: items.length,
    statusCounts: { ACTIVE: items.length },
    columns: Object.keys(items[0]),
    items,
  };
  const finalRaw = writeArtifact(finalPath, final);
  const partitionPaths = [];
  const auditPartitions = [];
  for (const partitionId of [1, 2, 3]) {
    const value = {
      version: '4.0',
      artifactType: 'CAREERGROUND_PARTITION_RESULT',
      partitionId,
      asOfDate: targetAsOfDate,
      timezone: 'Asia/Seoul',
      runGroupKey: legacyRunGroupKey,
      assignedDiscoverySources: [`Fixture Source ${partitionId}`],
      ownership: { bucket: partitionId - 1 },
      timestamps: {
        researchStartedAt: '2026-08-28T18:00:00+09:00',
        filesGeneratedAt: '2026-08-28T18:05:00+09:00',
      },
      baseline: { rowCount: 0, canonicalJsonSha256: baselineHash },
      existingDecisions: [],
      discovered: [],
      newDecisions: [],
      excluded: [],
      uncertain: [],
      sourceCoverage: [],
      qualityGates: { overall: 'PASS' },
      blockingErrors: [],
      integrity: {
        canonicalization: 'PYTHON_SORTED_JSON_UTF8_V1',
        artifactCanonicalSha256: '',
        baselineCanonicalSha256: baselineHash,
        payloadCounts: {
          existingDecisions: 0,
          discovered: 0,
          newDecisions: 0,
          excluded: 0,
          uncertain: 0,
          sourceCoverage: 0,
        },
        payloadTailMarkers: {},
      },
    };
    value.integrity.artifactCanonicalSha256 = legacyArtifactCanonicalSha256(value);
    const path = join(directory, `careerground-partition-${partitionId}-${targetAsOfDate}.json`);
    const raw = writeArtifact(path, value);
    partitionPaths.push(path);
    auditPartitions.push({
      partitionId,
      actualFileName: `careerground-partition-${partitionId}-${targetAsOfDate}(1).json`,
      canonicalFileName: `careerground-partition-${partitionId}-${targetAsOfDate}.json`,
      fullJsonParsed: true,
      rawBytesSha256: rawSha256(raw),
      artifactCanonicalSha256: value.integrity.artifactCanonicalSha256,
      asOfDate: targetAsOfDate,
      runGroupKey: legacyRunGroupKey,
      qualityGateOverall: 'PASS',
      blockingErrorsCount: 0,
    });
  }
  const audit = {
    protocolVersion: '4.0',
    artifactType: 'CAREERGROUND_MERGE_AUDIT',
    targetAsOfDate,
    timezone: 'Asia/Seoul',
    runGroupKey: legacyRunGroupKey,
    baseline: { rowCount: 0, canonicalJsonSha256: baselineHash },
    partitions: auditPartitions,
    inputCompleteness: 'PASS',
    finalSnapshot: {
      fileName: `careerground-jobs-live-${targetAsOfDate}-final.json`,
      rowCount: items.length,
      statusCounts: final.statusCounts,
      newRowsAdded: items.length,
      rawBytesSha256: rawSha256(finalRaw),
      canonicalJsonSha256: legacyCanonicalSha256(final),
    },
    qualityGates: { overall: 'PASS', outputIntegrity: 'PASS' },
    blockingErrors: [],
    downstreamEligibility: 'ELIGIBLE',
  };
  writeArtifact(auditPath, audit);
  return { directory, partitionPaths, finalPath, auditPath, audit };
}

describe('legacy v4 compatibility adapter', () => {
  it('preserves the 6/6/5 source ownership contract without duplicates', () => {
    const sourcePolicy = JSON.parse(
      readFileSync(
        resolve(import.meta.dirname, '../../config/careerground-partition-sources.json'),
      ),
    );
    expect(sourcePolicy.partitions.map((partition) => partition.sources.length)).toEqual([6, 6, 5]);
    expect(sourcePolicy.partitions.map((partition) => partition.ownershipBucket)).toEqual([
      0, 1, 2,
    ]);
    const sources = sourcePolicy.partitions.flatMap((partition) => partition.sources);
    expect(sources).toHaveLength(17);
    expect(new Set(sources)).toHaveProperty('size', 17);
  });

  it('preserves an immutable source URL while deriving a normalized canonical key', () => {
    const job = jobForBucket(0);
    job.source_url = `${job.source_url}/`;
    const normalized = normalizeLegacyJob(job);
    expect(normalized.sourceUrl).toBe(job.source_url);
    expect(normalized.canonicalJobKey).toBe(job.source_url.slice(0, -1));
  });

  it('verifies the complete bundle and emits three v5 artifacts without operational writes', () => {
    const fixture = buildBundle();
    const run = identity();
    const bundle = loadLegacyV4Bundle({ ...fixture, identity: run });
    expect(bundle.report).toMatchObject({
      status: 'VERIFIED_COMPATIBLE',
      legacyRunGroupKey,
      productionDatabaseChanged: false,
      slackSent: false,
    });
    expect(bundle.partitionResults.map((result) => result.rowCount)).toEqual([1, 1, 1]);
    expect(bundle.partitionResults[0].items[0].techStack).toEqual(['Java']);

    const output = join(fixture.directory, 'converted');
    const reportPath = writeLegacyV4Conversion(output, bundle);
    expect(JSON.parse(readFileSync(reportPath, 'utf8')).status).toBe('VERIFIED_COMPATIBLE');
    for (const partitionId of [1, 2, 3]) {
      const loaded = loadExplicitPartition({
        path: join(output, `partition-${partitionId}.json`),
        partitionId,
        identity: run,
      });
      expect(loaded.result.partitionId).toBe(partitionId);
    }
  });

  it('rejects a final snapshot whose raw hash no longer matches the audit', () => {
    const fixture = buildBundle();
    const final = JSON.parse(readFileSync(fixture.finalPath, 'utf8'));
    final.items[0].title = '감사 이후 변조';
    writeArtifact(fixture.finalPath, final);
    expect(() => loadLegacyV4Bundle({ ...fixture, identity: identity() })).toThrow(
      expect.objectContaining({ code: 'LEGACY_AUDIT_FINAL_HASH_MISMATCH' }),
    );
  });

  it('rejects a partition artifact whose payload no longer matches its canonical hash', () => {
    const fixture = buildBundle();
    const partition = JSON.parse(readFileSync(fixture.partitionPaths[1], 'utf8'));
    partition.discovered.push({ raw_candidate_id: 'tampered' });
    writeArtifact(fixture.partitionPaths[1], partition);
    expect(() => loadLegacyV4Bundle({ ...fixture, identity: identity() })).toThrow(
      expect.objectContaining({ code: 'LEGACY_PARTITION_INTEGRITY_MISMATCH' }),
    );
  });
});
