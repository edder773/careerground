import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateValidatorSyncSql } from './generate-validator-job-sync-migration.mjs';

const root = 'data/imports/job-validator-sync-2026-08-25';

async function sources() {
  const [baselineSource, librarySource, auditSource] = await Promise.all([
    readFile(`${root}/baseline.json`, 'utf8'),
    readFile(`${root}/library-source-final.json`, 'utf8'),
    readFile(`${root}/merge-audit.json`, 'utf8'),
  ]);
  return { baselineSource, librarySource, auditSource };
}

function options(overrides: Record<string, unknown> = {}) {
  return {
    libraryFileName: 'careerground-jobs-live-2026-08-25-final.json',
    libraryFileId: 'libfile-test-final',
    auditFileName: 'careerground-merge-audit-2026-08-25.json',
    auditFileId: 'libfile-test-audit',
    migrationVersion: '0042_sync_validator_jobs_20260825',
    batchId: 'catalog-jobs-20260825-validator-confirmed',
    runAt: '2026-08-25T23:40:00+09:00',
    ...overrides,
  };
}

describe('CareerGround validator-confirmed job sync', () => {
  it('inserts confirmed ACTIVE rows, excludes new non-active rows, and updates only audited live rows', async () => {
    const result = generateValidatorSyncSql({ ...(await sources()), ...options() });

    expect(result.report.comparison).toMatchObject({
      baselineRows: 135,
      matchedExistingRows: 135,
      newSourceRows: 60,
      addedActiveRows: 33,
      excludedNewNonActiveRows: 27,
      updatedExistingRows: 5,
      auditRowsNotLive: 3,
      deletedRows: 0,
      storedRowsAfter: 168,
    });
    expect(result.report.precisionRule.appliedRows).toBe(33);
    expect(result.candidates).toHaveLength(33);
    expect(result.excluded).toHaveLength(27);
    expect(
      result.excluded.filter((row: { status: string }) => row.status === 'DEADLINE_UNKNOWN'),
    ).toHaveLength(24);
    expect(result.updates.map((row: { id: string }) => row.id).sort()).toEqual([
      'job-292d372adafc184df16346ee',
      'job-856b65c06063f216d97cfb80',
      'job-b63f6d92de595b8a56216da2',
      'job-cea1ba1532476101d85d44d8',
      'job-e124115602975a1b56282e3d',
    ]);
    expect(result.sql?.match(/INSERT INTO jobs\n/gu)).toHaveLength(33);
    expect(result.sql?.match(/UPDATE jobs\n/gu)).toHaveLength(5);
    expect(result.sql).not.toMatch(/DELETE\s+FROM\s+jobs/iu);
    expect(result.sql).not.toContain('saved_jobs');
  });

  it('accepts only the documented sub-second export precision difference', async () => {
    const current = await sources();
    expect(() =>
      generateValidatorSyncSql({ ...current, ...options(), precisionToleranceMs: 999 }),
    ).not.toThrow();
    expect(() =>
      generateValidatorSyncSql({ ...current, ...options(), precisionToleranceMs: 926 }),
    ).toThrow(/precision tolerance/);
  });

  it('rejects an unconfirmed audit update instead of changing a live row', async () => {
    const current = await sources();
    const audit = JSON.parse(current.auditSource);
    audit.existingStatusChanges[0].finalRecheckStatus = 'RETAINED_UNCONFIRMED';

    expect(() =>
      generateValidatorSyncSql({
        ...current,
        auditSource: JSON.stringify(audit),
        ...options(),
      }),
    ).toThrow(/not confirmed/);
  });

  it('rejects a Library payload that no longer matches the audit SHA-256', async () => {
    const current = await sources();
    const library = JSON.parse(current.librarySource);
    library.items[0].summary = `${library.items[0].summary} 변경`;

    expect(() =>
      generateValidatorSyncSql({
        ...current,
        librarySource: `${JSON.stringify(library, null, 2)}\n`,
        ...options(),
      }),
    ).toThrow(/SHA-256/);
  });

  it('rejects a new URL that collides with a live fingerprint', async () => {
    const current = await sources();
    const baseline = JSON.parse(current.baselineSource);
    const library = JSON.parse(current.librarySource);
    const liveUrls = new Set(baseline.rows.map((row: { source_url: string }) => row.source_url));
    const candidate = library.items.find(
      (row: { status: string; source_url: string }) =>
        row.status === 'ACTIVE' && !liveUrls.has(row.source_url),
    );
    candidate.fingerprint = baseline.rows[0].fingerprint;
    library.statusCounts = library.items.reduce(
      (counts: Record<string, number>, row: { status: string }) => {
        counts[row.status] = (counts[row.status] ?? 0) + 1;
        return counts;
      },
      {},
    );
    const mutatedLibrarySource = `${JSON.stringify(library, null, 2)}\n`;
    const audit = JSON.parse(current.auditSource);
    audit.finalOutput.sha256 = createHash('sha256').update(mutatedLibrarySource).digest('hex');

    expect(() =>
      generateValidatorSyncSql({
        ...current,
        librarySource: mutatedLibrarySource,
        auditSource: JSON.stringify(audit),
        ...options(),
      }),
    ).toThrow(/duplicate fingerprints|conflict/);
  });
});
