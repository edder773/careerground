import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import sourcePolicy from '../../config/careerground-partition-sources.json' with { type: 'json' };
import {
  validateDiscoveryBundle,
  validateDiscoveryDelta,
  writeDiscoveryBundle,
} from './discovery-delta.mjs';

const targetAsOfDate = '2026-08-28';

function item(sourceName, suffix) {
  return {
    sourceUrl: `https://${suffix}.example.test/jobs/${suffix}?utm_source=test`,
    sourceName,
    sourcePostingId: suffix,
    companyName: `비식별 회사 ${suffix}`,
    companySize: 'LARGE',
    companySizeEvidence: '비식별 근거',
    title: `신입 백엔드 개발자 ${suffix}`,
    category: '백엔드',
    careerScope: 'NEW_GRAD_ONLY',
    careerEvidence: '신입 지원 가능',
    employmentType: 'FULL_TIME',
    region: '서울',
    remote: false,
    techStack: ['Java'],
    publishedAt: '2026-08-28T00:00:00.000Z',
    applicationStartAt: '2026-08-28T00:00:00.000Z',
    deadlineAt: '2026-09-30T14:59:59.000Z',
    rolling: false,
    summary: '비식별 신규 공고',
    status: 'ACTIVE',
    collectedAt: '2026-08-28T09:00:00.000Z',
    lastVerifiedAt: '2026-08-28T09:00:00.000Z',
  };
}

function delta(partitionId, items = []) {
  const policy = sourcePolicy.partitions[partitionId - 1];
  return {
    schemaVersion: '5.1',
    artifactType: 'CAREERGROUND_DISCOVERY_DELTA',
    workflowId: 'CG-JOBS-PROD-V5',
    targetAsOfDate,
    runGroupKey: `CG-${targetAsOfDate}`,
    timezone: 'Asia/Seoul',
    partitionId,
    attempt: 1,
    status: 'SUCCESS',
    sources: policy.sources,
    startedAt: '2026-08-28T09:00:00.000Z',
    completedAt: '2026-08-28T09:05:00.000Z',
    exportedAt: '2026-08-28T09:05:00.000Z',
    rowCount: items.length,
    items,
    excluded: [],
    uncertain: [],
    sourceCoverage: policy.sources.map((sourceName) => ({ sourceName, status: 'COMPLETE' })),
    qualityGates: { overall: 'PASS' },
    blockingErrors: [],
    productionDatabaseChanged: false,
    slackSent: false,
  };
}

function writeBundle(values) {
  const directory = mkdtempSync(join(tmpdir(), 'cg-discovery-'));
  return values.map((value, index) => {
    const path = join(directory, `partition-${index + 1}.json`);
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
    return path;
  });
}

describe('CareerGround discovery-only collector contract', () => {
  it('accepts zero new candidates without a baseline file or local hash', () => {
    const value = delta(1);
    const loaded = validateDiscoveryDelta(value, {
      partitionPolicy: sourcePolicy.partitions[0],
      targetAsOfDate,
    });
    expect(loaded.normalizedItems).toEqual([]);
    expect(loaded.descriptor).toMatchObject({ partitionId: 1, rowCount: 0 });
  });

  it('normalizes deterministic identifiers in GitHub instead of the ChatGPT task', () => {
    const value = delta(1, [item('JobKorea', 'jobkorea-101')]);
    const [normalized] = validateDiscoveryDelta(value, {
      partitionPolicy: sourcePolicy.partitions[0],
      targetAsOfDate,
    }).normalizedItems;
    expect(normalized.id).toMatch(/^job-[a-f0-9]{24}$/u);
    expect(normalized.canonicalJobKey).toBe('source:jobkorea-101.example.test:jobkorea-101');
    expect(normalized.sourceUrl).not.toContain('utm_source');
    expect(normalized.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('normalizes observed Korean and legacy enum aliases before production publish', () => {
    const value = delta(3, [
      {
        ...item('Jasoseol', 'alias-enums'),
        careerScope: '신입',
        companySize: '대기업',
        employmentType: '신입사원',
      },
    ]);
    const loaded = validateDiscoveryDelta(value, {
      partitionPolicy: sourcePolicy.partitions[2],
      targetAsOfDate,
    });
    expect(loaded.normalizedItems[0]).toMatchObject({
      careerScope: 'NEW_GRAD_ONLY',
      companySize: 'LARGE',
      employmentType: 'FULL_TIME',
    });
    const expectedFingerprint = createHash('sha256')
      .update('비식별 회사 alias-enums|신입 백엔드 개발자 alias-enums|서울|full_time')
      .digest('hex');
    expect(loaded.normalizedItems[0].fingerprint).toBe(expectedFingerprint);
    expect(loaded.descriptor.itemAliasesNormalized).toBe(3);
  });

  it.each([
    'MID_SIZED',
    'MID_SIZED_ENTERPRISE',
    'MIDSIZE_ENTERPRISE',
    'MIDSIZEDENTERPRISE',
    'mid-size enterprise',
    'medium-sized enterprise',
  ])('normalizes the unambiguous company-size variant %s before production publish', (alias) => {
    const value = delta(1, [
      {
        ...item('JobKorea', 'mid-sized-enterprise'),
        companySize: alias,
      },
    ]);
    const loaded = validateDiscoveryDelta(value, {
      partitionPolicy: sourcePolicy.partitions[0],
      targetAsOfDate,
    });
    expect(loaded.normalizedItems[0].companySize).toBe('MID');
    expect(loaded.descriptor.itemAliasesNormalized).toBe(1);
  });

  it('rejects unknown company-size values before production publish', () => {
    const value = delta(1, [
      { ...item('JobKorea', 'unknown-company-size'), companySize: 'ENTERPRISE_PLUS' },
    ]);
    expect(() =>
      validateDiscoveryDelta(value, {
        partitionPolicy: sourcePolicy.partitions[0],
        targetAsOfDate,
      }),
    ).toThrow(expect.objectContaining({ code: 'DISCOVERY_POLICY_INVALID' }));
  });

  it('allows one blocked source while preserving a successful partition', () => {
    const value = delta(2);
    value.sourceCoverage[1] = {
      sourceName: sourcePolicy.partitions[1].sources[1],
      status: 'BLOCKED',
      reason: 'HTTP_403',
    };
    value.qualityGates.overall = 'PASS_WITH_PARTIAL_COVERAGE';
    expect(
      validateDiscoveryDelta(value, {
        partitionPolicy: sourcePolicy.partitions[1],
        targetAsOfDate,
      }).descriptor.coverage,
    ).toHaveProperty(sourcePolicy.partitions[1].sources[1], 'BLOCKED');
  });

  it('normalizes the observed source/note coverage aliases at the GitHub boundary', () => {
    const value = delta(2);
    value.sourceCoverage = value.sourceCoverage.map(({ sourceName, status }) => ({
      source: sourceName,
      status,
      note: '비식별 조사 범위',
    }));
    const loaded = validateDiscoveryDelta(value, {
      partitionPolicy: sourcePolicy.partitions[1],
      targetAsOfDate,
    });
    expect(loaded.descriptor.coverageAliasesNormalized).toBe(6);
    expect(loaded.descriptor.coverage).toEqual(
      Object.fromEntries(
        sourcePolicy.partitions[1].sources.map((sourceName) => [sourceName, 'COMPLETE']),
      ),
    );
    expect(loaded.normalizedCoverage[0]).toMatchObject({
      sourceName: sourcePolicy.partitions[1].sources[0],
      notes: '비식별 조사 범위',
    });
  });

  it('rejects conflicting canonical and alias coverage source names', () => {
    const value = delta(2);
    value.sourceCoverage[0] = {
      ...value.sourceCoverage[0],
      source: sourcePolicy.partitions[1].sources[1],
    };
    expect(() =>
      validateDiscoveryDelta(value, {
        partitionPolicy: sourcePolicy.partitions[1],
        targetAsOfDate,
      }),
    ).toThrow(expect.objectContaining({ code: 'DISCOVERY_COVERAGE_INVALID' }));
  });

  it('rejects a partition when every assigned source is unavailable', () => {
    const value = delta(3);
    value.sourceCoverage = value.sourceCoverage.map((entry) => ({
      ...entry,
      status: 'BLOCKED',
    }));
    value.qualityGates.overall = 'PASS_WITH_PARTIAL_COVERAGE';
    expect(() =>
      validateDiscoveryDelta(value, {
        partitionPolicy: sourcePolicy.partitions[2],
        targetAsOfDate,
      }),
    ).toThrow(expect.objectContaining({ code: 'DISCOVERY_COVERAGE_INVALID' }));
  });

  it('rejects a source outside the partition ownership contract', () => {
    const value = delta(1, [item('Saramin', 'wrong-owner')]);
    expect(() =>
      validateDiscoveryDelta(value, {
        partitionPolicy: sourcePolicy.partitions[0],
        targetAsOfDate,
      }),
    ).toThrow(expect.objectContaining({ code: 'DISCOVERY_SOURCE_OWNERSHIP_INVALID' }));
  });

  it('validates three deltas and writes normalized v5 artifacts without side effects', () => {
    const values = sourcePolicy.partitions.map((policy, index) =>
      delta(index + 1, [item(policy.sources[0], `partition-${index + 1}`)]),
    );
    const paths = writeBundle(values);
    const bundle = validateDiscoveryBundle({
      partitionPaths: paths,
      targetAsOfDate,
      sourcePolicy,
      runId: 'CG-2026-08-28-A1-discovery1',
    });
    expect(bundle.report).toMatchObject({
      status: 'VERIFIED_DISCOVERY',
      rowCount: 3,
      productionDatabaseChanged: false,
      slackSent: false,
    });
    const output = mkdtempSync(join(tmpdir(), 'cg-discovery-output-'));
    const reportPath = writeDiscoveryBundle(output, bundle);
    expect(JSON.parse(readFileSync(reportPath, 'utf8')).status).toBe('VERIFIED_DISCOVERY');
    expect(JSON.parse(readFileSync(join(output, 'partition-1.json'), 'utf8'))).toMatchObject({
      schemaVersion: '5.0',
      rowCount: 1,
    });
  });

  it('rejects exact URL duplication across partitions', () => {
    const first = item('JobKorea', 'duplicate');
    const second = { ...first, sourceName: 'Saramin' };
    const paths = writeBundle([delta(1, [first]), delta(2, [second]), delta(3)]);
    expect(() =>
      validateDiscoveryBundle({
        partitionPaths: paths,
        targetAsOfDate,
        sourcePolicy,
        runId: 'CG-2026-08-28-A1-discovery2',
      }),
    ).toThrow(expect.objectContaining({ code: 'DISCOVERY_CROSS_PARTITION_URL_DUPLICATE' }));
  });
});
