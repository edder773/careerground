import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { generateLibraryInsertSql } from './generate-library-job-insert-migration.mjs';

const baselinePath = 'data/imports/job-library-import-2026-08-24/baseline.json';
const libraryPath = 'data/imports/job-library-import-2026-08-24/library-source-final.json';

async function currentSources() {
  const [baselineSource, librarySource] = await Promise.all([
    readFile(baselinePath, 'utf8'),
    readFile(libraryPath, 'utf8'),
  ]);
  return { baselineSource, librarySource };
}

function options(overrides: Record<string, unknown> = {}) {
  return {
    libraryFileName: 'careerground-jobs-live-2026-08-24-final.json',
    libraryFileId: 'libfile-test',
    migrationVersion: '0042_import_library_jobs_20260824',
    batchId: 'catalog-jobs-20260824-library-active',
    runAt: '2026-08-24T15:20:00+09:00',
    ...overrides,
  };
}

describe('library-only job insert migration', () => {
  it('inserts only new ACTIVE rows from the final Library JSON', async () => {
    const sources = await currentSources();
    const result = generateLibraryInsertSql({ ...sources, ...options() });

    expect(result.report.comparison).toEqual({
      baselineRows: 115,
      matchedExistingRows: 115,
      newSourceRows: 23,
      addedActiveRows: 5,
      excludedNewNonActiveRows: 18,
      excludedStaleActiveRows: 0,
      conflictRows: 0,
      updatedExistingRows: 0,
      deletedRows: 0,
      storedRowsAfter: 120,
    });
    expect(result.candidates).toHaveLength(5);
    expect(result.excluded).toHaveLength(18);
    expect(result.candidates.every((row: { status: string }) => row.status === 'ACTIVE')).toBe(
      true,
    );
    expect(result.sql?.match(/INSERT INTO jobs\n/g)).toHaveLength(5);
    expect(result.sql).toContain('ON CONFLICT(source_url) DO NOTHING');
    expect(result.sql).not.toMatch(/UPDATE\s+jobs/iu);
    expect(result.sql).not.toMatch(/DELETE\s+FROM\s+jobs/iu);
    expect(result.sql).not.toContain('saved_jobs');
  });

  it('creates no migration when the same Library snapshot is already present', async () => {
    const { librarySource } = await currentSources();
    const result = generateLibraryInsertSql({
      baselineSource: librarySource,
      librarySource,
      ...options(),
    });

    expect(result.noChange).toBe(true);
    expect(result.sql).toBeNull();
    expect(result.report.comparison.addedActiveRows).toBe(0);
    expect(result.report.comparison.updatedExistingRows).toBe(0);
    expect(result.report.comparison.deletedRows).toBe(0);
  });

  it('rejects non-final or date-mismatched Library filenames', async () => {
    const sources = await currentSources();

    expect(() =>
      generateLibraryInsertSql({
        ...sources,
        ...options({ libraryFileName: 'careerground-jobs-live-2026-08-24(3).json' }),
      }),
    ).toThrow(/Library filename must match/);

    expect(() =>
      generateLibraryInsertSql({
        ...sources,
        ...options({ libraryFileName: 'careerground-jobs-live-2026-08-23-final.json' }),
      }),
    ).toThrow(/filename date must match exportedAt/);
  });

  it('excludes stale ACTIVE rows without blocking valid new rows', async () => {
    const sources = await currentSources();
    const library = JSON.parse(sources.librarySource);
    const baseline = JSON.parse(sources.baselineSource);
    const newActive = library.items.find(
      (row: { status: string; source_url: string }) =>
        row.status === 'ACTIVE' &&
        !baseline.items.some(
          (existing: { source_url: string }) => existing.source_url === row.source_url,
        ),
    );
    newActive.rolling = 0;
    newActive.deadline_at = '2026-08-23T14:59:59.000Z';

    const result = generateLibraryInsertSql({
      baselineSource: sources.baselineSource,
      librarySource: JSON.stringify(library),
      ...options(),
    });

    expect(result.candidates).toHaveLength(4);
    expect(result.excluded).toContainEqual(
      expect.objectContaining({ id: newActive.id, reason: 'STALE_ACTIVE_EXCLUDED' }),
    );
    expect(result.report.comparison.excludedStaleActiveRows).toBe(1);
  });

  it('rejects a new URL that collides with a baseline fingerprint', async () => {
    const sources = await currentSources();
    const library = JSON.parse(sources.librarySource);
    const baseline = JSON.parse(sources.baselineSource);
    const newActive = library.items.find(
      (row: { status: string; source_url: string }) =>
        row.status === 'ACTIVE' &&
        !baseline.items.some(
          (existing: { source_url: string }) => existing.source_url === row.source_url,
        ),
    );
    const collisionSource = baseline.items[0];
    library.items = library.items.filter(
      (row: { source_url: string }) => row.source_url !== collisionSource.source_url,
    );
    library.rowCount = library.items.length;
    library.statusCounts[collisionSource.status] -= 1;
    newActive.fingerprint = collisionSource.fingerprint;

    expect(() =>
      generateLibraryInsertSql({
        baselineSource: sources.baselineSource,
        librarySource: JSON.stringify(library),
        ...options(),
      }),
    ).toThrow(/baseline id\/fingerprint conflict/);
  });
});
