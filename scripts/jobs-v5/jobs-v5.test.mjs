import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadExplicitPartition } from './adapter.mjs';
import {
  canonicalSha256,
  canonicalStringify,
  canonicalizeHttpUrl,
  normalizeDownloadDisplayName,
  rawSha256,
} from './canonical-json.mjs';
import { V5Error, assertTransition, createExecutionIdentity, transition } from './contracts.mjs';
import {
  businessDayDecision,
  holidayCacheChecksum,
  resolveHolidayCache,
  validateHolidayCache,
} from './holiday-cache.mjs';
import {
  assertManifestChecksum,
  updatePointerAtomically,
  validateManifest,
  withManifestChecksum,
} from './manifest.mjs';
import { buildNotificationPreview, notifyPublishedRun } from './notify.mjs';
import { orchestrate } from './orchestrate.mjs';
import { collect, merge, validateAndPlan } from './pipeline.mjs';

const fixture = (name) => resolve(import.meta.dirname, 'fixtures', name);
const config = (name) => resolve(import.meta.dirname, '../../config', name);
const identity = (patch = {}) => ({
  ...createExecutionIdentity({
    targetAsOfDate: '2026-08-27',
    attempt: 1,
    mode: 'DRY_RUN',
    nonce: 'fixture1',
    now: new Date('2026-08-27T08:59:00.000Z'),
  }),
  ...patch,
});

const clonePartition = (partitionId, mutate = (value) => value, fileName) => {
  const directory = mkdtempSync(join(tmpdir(), 'cg-v5-partition-'));
  const value = mutate(JSON.parse(readFileSync(fixture(`partition-${partitionId}.json`), 'utf8')));
  const path = join(directory, fileName || `partition-${partitionId}.json`);
  writeFileSync(path, JSON.stringify(value, null, 2));
  return path;
};

const running = () => transition(identity(), 'RUNNING');
const loadedFixtures = (run = running()) =>
  [1, 2, 3].map((partitionId) =>
    loadExplicitPartition({
      path: fixture(`partition-${partitionId}.json`),
      partitionId,
      identity: run,
    }),
  );

describe('v5 execution identity and status machine', () => {
  it('keeps the target date in runGroupKey and changes only runId/attempt on retry', () => {
    const first = identity();
    const retry = createExecutionIdentity({
      targetAsOfDate: first.targetAsOfDate,
      attempt: 2,
      mode: 'RESUME',
      nonce: 'retry001',
    });
    expect(retry.runGroupKey).toBe(first.runGroupKey);
    expect(retry.targetAsOfDate).toBe(first.targetAsOfDate);
    expect(retry.runId).not.toBe(first.runId);
  });

  it.each([
    ['FAILED_INPUT', 'PUBLISHED'],
    ['QUARANTINED', 'PUBLISHED'],
    ['RUNNING', 'VERIFIED'],
    ['PENDING', 'SUCCESS_NO_CHANGES'],
  ])('rejects forbidden transition %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(V5Error);
  });
});

describe('canonical JSON and explicit artifacts', () => {
  it('sorts object keys and declared unordered arrays but keeps meaningful arrays stable', () => {
    const left = { z: 1, sources: ['b', 'a'], sequence: [2, 1], nested: { b: 2, a: 1 } };
    const right = { nested: { a: 1, b: 2 }, sequence: [2, 1], sources: ['a', 'b'], z: 1 };
    expect(canonicalStringify(left)).toBe(canonicalStringify(right));
    expect(canonicalSha256(left)).toBe(canonicalSha256(right));
    expect(canonicalStringify({ sequence: [1, 2] })).not.toBe(
      canonicalStringify({ sequence: [2, 1] }),
    );
  });

  it.each([
    ['partition-3.json', 'partition-3.json'],
    ['partition-3(1).json', 'partition-3.json'],
    ['partition-3 (2).json', 'partition-3.json'],
    ['partition-3(3)(1).json', 'partition-3.json'],
  ])('normalizes %s for display only', (input, expected) => {
    expect(normalizeDownloadDisplayName(input)).toBe(expected);
  });

  it('uses JSON metadata rather than a filename number', () => {
    const path = clonePartition(1, (value) => value, 'partition-3 (8).json');
    const loaded = loadExplicitPartition({ path, partitionId: 1, identity: running() });
    expect(loaded.result.partitionId).toBe(1);
    expect(loaded.descriptor.displayName).toBe('partition-3.json');
  });

  it('keeps raw and canonical hashes separate', () => {
    const compact = Buffer.from('{"a":1,"b":2}');
    const spaced = Buffer.from('{\n  "b": 2,\n  "a": 1\n}');
    expect(rawSha256(compact)).not.toBe(rawSha256(spaced));
    expect(canonicalSha256(JSON.parse(compact))).toBe(canonicalSha256(JSON.parse(spaced)));
  });

  it('canonicalizes hosts, tracking parameters, query order, fragments, and trailing slashes', () => {
    expect(canonicalizeHttpUrl('HTTPS://EXAMPLE.test/jobs/1/?utm_source=x&b=2&a=1#top')).toBe(
      'https://example.test/jobs/1?a=1&b=2',
    );
  });

  it.each([
    ['rawSha256', '0'.repeat(64), 'PARTITION_RAW_HASH_MISMATCH'],
    ['canonicalSha256', '0'.repeat(64), 'PARTITION_CANONICAL_HASH_MISMATCH'],
  ])('rejects a %s mismatch', (field, value, code) => {
    const path = fixture('partition-1.json');
    expect(() =>
      loadExplicitPartition({
        path,
        partitionId: 1,
        identity: running(),
        expectedHashes: { [field]: value },
      }),
    ).toThrow(expect.objectContaining({ code }));
  });
});

describe('partition collection and merge isolation', () => {
  it('merges partitions 1, 2, and 3', () => {
    const result = merge(running(), loadedFixtures());
    expect(result).toMatchObject({ inputRowCount: 3, rowCount: 3, removedDuplicates: 0 });
  });

  it('reuses an explicitly hashed successful partition in RESUME mode', () => {
    const resume = transition(identity({ mode: 'RESUME' }), 'RUNNING');
    const initial = loadExplicitPartition({
      path: fixture('partition-1.json'),
      partitionId: 1,
      identity: resume,
    });
    const reused = loadExplicitPartition({
      path: fixture('partition-1.json'),
      partitionId: 1,
      identity: resume,
      expectedHashes: {
        rawSha256: initial.descriptor.rawSha256,
        canonicalSha256: initial.descriptor.canonicalSha256,
      },
    });
    expect(reused.descriptor).toEqual(initial.descriptor);
  });

  it('rejects a missing partition', () => {
    expect(() => merge(running(), loadedFixtures().slice(0, 2))).toThrow(
      expect.objectContaining({ code: 'PARTITION_MISSING' }),
    );
  });

  it('rejects a duplicate partitionId', () => {
    const run = running();
    expect(() =>
      collect(run, [
        { path: fixture('partition-1.json'), partitionId: 1 },
        { path: fixture('partition-1.json'), partitionId: 1 },
        { path: fixture('partition-3.json'), partitionId: 3 },
      ]),
    ).toThrow(expect.objectContaining({ code: 'DUPLICATE_PARTITION' }));
  });

  it.each([
    ['targetAsOfDate', '2026-08-26'],
    ['runGroupKey', 'CG-2026-08-26'],
    ['workflowId', 'CG-OTHER'],
    ['schemaVersion', '4.0'],
  ])('rejects mixed %s', (field, value) => {
    const path = clonePartition(2, (partition) => ({ ...partition, [field]: value }));
    expect(() => loadExplicitPartition({ path, partitionId: 2, identity: running() })).toThrow();
  });

  it('rejects invalid JSON and a missing explicit file as failures, not no changes', () => {
    const directory = mkdtempSync(join(tmpdir(), 'cg-v5-invalid-'));
    const invalid = join(directory, 'partition.json');
    writeFileSync(invalid, '{not-json');
    expect(() =>
      loadExplicitPartition({ path: invalid, partitionId: 1, identity: running() }),
    ).toThrow(expect.objectContaining({ status: 'FAILED_INPUT' }));
    expect(() =>
      loadExplicitPartition({
        path: join(directory, 'missing.json'),
        partitionId: 1,
        identity: running(),
      }),
    ).toThrow(expect.objectContaining({ status: 'FAILED_COLLECTION' }));
  });
});

describe('quality gates and no-change semantics', () => {
  const policy = JSON.parse(readFileSync(config('careerground-validation-policy.json'), 'utf8'));

  it('verifies normal fixture changes', () => {
    const run = running();
    const loaded = loadedFixtures(run);
    const result = validateAndPlan(run, loaded, merge(run, loaded), [], policy);
    expect(result.manifest.status).toBe('VERIFIED');
    expect(result.manifest.counts).toMatchObject({ new: 3, changed: 0, ended: 0 });
  });

  it('allows SUCCESS_NO_CHANGES only after complete collection and validation', () => {
    const run = running();
    const loaded = loadedFixtures(run);
    const merged = merge(run, loaded);
    const result = validateAndPlan(run, loaded, merged, merged.items, policy);
    expect(result.manifest.status).toBe('VERIFIED');
    expect(result.manifest.counts).toMatchObject({ new: 0, changed: 0, ended: 0 });
  });

  it('quarantines a zero-row partition', () => {
    const path = clonePartition(3, (partition) => ({ ...partition, rowCount: 0, items: [] }));
    const run = running();
    const loaded = [
      ...loadedFixtures(run).slice(0, 2),
      loadExplicitPartition({ path, partitionId: 3, identity: run }),
    ];
    const result = validateAndPlan(run, loaded, merge(run, loaded), [], policy);
    expect(result.manifest.status).toBe('QUARANTINED');
    expect(result.manifest.qualityGate.reasons).toContain('PARTITION_3_BELOW_MINIMUM');
  });

  it('quarantines an active-count collapse and mass endings', () => {
    const run = running();
    const loaded = loadedFixtures(run);
    const merged = merge(run, loaded);
    const baseline = Array.from({ length: 30 }, (_, index) => ({
      id: `old-${index}`,
      canonicalJobKey: `old:${index}`,
      status: 'ACTIVE',
    }));
    const result = validateAndPlan(run, loaded, merged, baseline, policy);
    expect(result.manifest.status).toBe('QUARANTINED');
    expect(result.manifest.qualityGate.reasons).toContain('ACTIVE_COUNT_DROP');
  });

  it('quarantines a source-specific collection collapse', () => {
    const run = running();
    const loaded = loadedFixtures(run);
    const merged = merge(run, loaded);
    const baseline = Array.from({ length: 4 }, (_, index) => ({
      id: `source-old-${index}`,
      canonicalJobKey: `source-old:${index}`,
      status: 'EXPIRED',
      sourceName: 'Missing Fixture Source',
    }));
    const result = validateAndPlan(run, loaded, merged, baseline, policy);
    expect(result.manifest.qualityGate.reasons).toContain('SOURCE_DROP:Missing Fixture Source');
  });
});

describe('holiday cache', () => {
  const cache = JSON.parse(readFileSync(config('careerground-holidays-2026.json'), 'utf8'));

  it('distinguishes weekends and holidays in Asia/Seoul', () => {
    expect(businessDayDecision('2026-08-29', cache).status).toBe('SKIPPED_WEEKEND');
    expect(businessDayDecision('2026-08-17', cache).status).toBe('SKIPPED_HOLIDAY');
    expect(businessDayDecision('2026-08-27', cache).status).toBe('RUNNING');
  });

  it('detects cache corruption', () => {
    expect(() => validateHolidayCache({ ...cache, holidays: [] })).toThrow(
      expect.objectContaining({ code: 'HOLIDAY_CACHE_CORRUPT' }),
    );
  });

  it('falls back to a still-allowed cache when refresh fails', async () => {
    const extended = { ...cache, validUntil: '2026-08-01', fallbackValidUntil: '2026-12-31' };
    extended.checksum = holidayCacheChecksum(extended);
    const result = await resolveHolidayCache(extended, {
      now: new Date('2026-08-27T00:00:00Z'),
      refresh: async () => {
        throw new Error('offline');
      },
    });
    expect(result.source).toBe('cache-fallback');
    expect(result.warning).toContain('offline');
  });
});

describe('manifest pointers and Slack separation', () => {
  it('rejects a missing manifest field and checksum mismatch', async () => {
    const result = await orchestrate({
      targetAsOfDate: '2026-08-27',
      runId: 'CG-2026-08-27-A1-fixture1',
      partitionPaths: [
        fixture('partition-1.json'),
        fixture('partition-2.json'),
        fixture('partition-3.json'),
      ],
      baselinePath: fixture('baseline.json'),
      holidayCachePath: config('careerground-holidays-2026.json'),
      validationPolicyPath: config('careerground-validation-policy.json'),
    });
    expect(() => validateManifest({ ...result.manifest, counts: undefined })).toThrow();
    expect(() =>
      assertManifestChecksum({
        ...result.manifest,
        counts: { ...result.manifest.counts, new: 999 },
      }),
    ).toThrow(expect.objectContaining({ code: 'MANIFEST_HASH_MISMATCH' }));
  });

  it('protects last-success and writes it only for PUBLISHED', async () => {
    const result = await orchestrate({
      targetAsOfDate: '2026-08-27',
      runId: 'CG-2026-08-27-A1-fixture1',
      partitionPaths: [
        fixture('partition-1.json'),
        fixture('partition-2.json'),
        fixture('partition-3.json'),
      ],
      baselinePath: fixture('baseline.json'),
      holidayCachePath: config('careerground-holidays-2026.json'),
      validationPolicyPath: config('careerground-validation-policy.json'),
    });
    const directory = mkdtempSync(join(tmpdir(), 'cg-v5-pointer-'));
    expect(() =>
      updatePointerAtomically(
        directory,
        'last-success',
        { runId: result.manifest.runId },
        result.manifest,
      ),
    ).toThrow(expect.objectContaining({ code: 'LAST_SUCCESS_REQUIRES_PUBLISHED' }));
    const published = withManifestChecksum({
      ...result.manifest,
      status: 'PUBLISHED',
      publishedAt: '2026-08-27T10:00:00.000Z',
    });
    expect(
      updatePointerAtomically(directory, 'last-success', { runId: published.runId }, published),
    ).toContain('last-success.json');
  });

  it('refuses incomplete/quarantined manifests and keeps send failure retryable', async () => {
    const base = { status: 'RUNNING' };
    expect(() => buildNotificationPreview(base)).toThrow(
      expect.objectContaining({ code: 'NOTIFICATION_REQUIRES_PUBLISHED' }),
    );
    expect(() => buildNotificationPreview({ status: 'QUARANTINED' })).toThrow();
    const published = {
      status: 'PUBLISHED',
      targetAsOfDate: '2026-08-27',
      runId: 'run',
      counts: { new: 1, changed: 0, ended: 0, excluded: 0, active: 1 },
      db: { status: 'PUBLISHED' },
    };
    const failure = await notifyPublishedRun(published, {
      send: async () => {
        throw new Error('network');
      },
    });
    expect(failure).toMatchObject({
      status: 'FAILED',
      retryPending: true,
      errorCode: 'SLACK_SEND_FAILED',
    });
  });
});
