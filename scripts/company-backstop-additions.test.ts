import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { generateReconciliationSql } from './generate-job-reconciliation-migration.mjs';

const paths = {
  existing: 'data/imports/job-refresh-2026-08-21/company-backstop-existing.json',
  incoming: 'data/imports/job-refresh-2026-08-21/company-backstop-additions.json',
  audit: 'data/imports/job-refresh-2026-08-21/company-backstop-reconciliation.json',
  migration: 'drizzle/0027_add_company_backstop_jobs_20260821.sql',
  migrationVersion: '0027_add_company_backstop_jobs_20260821',
  batchId: 'catalog-jobs-20260821-company-backstop',
};

describe('company-name backstop additions', () => {
  it('adds only the two evidence-backed jobs without deleting existing or saved jobs', async () => {
    const [existingSource, incomingSource, auditSource, migrationSource] = await Promise.all([
      readFile(paths.existing, 'utf8'),
      readFile(paths.incoming, 'utf8'),
      readFile(paths.audit, 'utf8'),
      readFile(paths.migration, 'utf8'),
    ]);
    const result = generateReconciliationSql({
      existingSource,
      incomingSource,
      auditSource,
      migrationVersion: paths.migrationVersion,
      batchId: paths.batchId,
    });

    expect(result.counts).toEqual({
      existingItems: 0,
      incomingItems: 2,
      matchedItems: 0,
      addedItems: 2,
      expiredByDeadlineItems: 0,
      removedItems: 0,
      retainedUnconfirmedItems: 0,
      retainedExistingRollingItems: 0,
      storedItemsAfter: 2,
      visibleItemsAfter: 2,
    });
    expect(migrationSource).toBe(result.sql);
    expect(migrationSource.match(/INSERT INTO jobs\n/g)).toHaveLength(2);
    expect(migrationSource).toContain('https://www.skcareers.com/Recruit/Detail/R261762');
    expect(migrationSource).toContain('https://job.alio.go.kr/recruitview.do?idx=303880');
    expect(migrationSource).not.toMatch(/DELETE FROM (?:jobs|saved_jobs)/u);
    expect(migrationSource).not.toMatch(/UPDATE (?:jobs|saved_jobs)\nSET status/u);
  });
});
