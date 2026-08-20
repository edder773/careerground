import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  generateReconciliationSql,
  reconciliationPaths,
  validateReconciliation,
} from './generate-job-reconciliation-migration.mjs';

async function fixtures() {
  const [existingSource, incomingSource, auditSource] = await Promise.all([
    readFile(reconciliationPaths.existing, 'utf8'),
    readFile(reconciliationPaths.incoming, 'utf8'),
    readFile(reconciliationPaths.audit, 'utf8'),
  ]);
  return { existingSource, incomingSource, auditSource };
}

describe('job catalog delta reconciliation', () => {
  it('adds and updates the supplied jobs without deleting personal data', async () => {
    const result = generateReconciliationSql(await fixtures());

    expect(result.counts).toEqual({
      existingItems: 51,
      incomingItems: 29,
      matchedItems: 13,
      addedItems: 16,
      expiredByDeadlineItems: 7,
      retainedExistingRollingItems: 7,
      storedItemsAfter: 67,
      visibleItemsAfter: 60,
    });
    expect(result.sql.match(/INSERT INTO jobs\n/g)).toHaveLength(29);
    expect(result.sql.match(/SET status = 'EXPIRED'/g)).toHaveLength(7);
    expect(result.sql).toContain('ON CONFLICT(source_url) DO UPDATE SET');
    expect(result.sql).toContain('application_start_at');
    expect(result.sql).not.toContain('DELETE FROM jobs');
    expect(result.sql).not.toContain('DELETE FROM saved_jobs');
    expect(result.sql).not.toContain("SET status = 'REMOVED'");
  });

  it('rejects an unverified removal caused only by snapshot absence', async () => {
    const sources = await fixtures();
    const existing = JSON.parse(sources.existingSource);
    const incoming = JSON.parse(sources.incomingSource);
    const audit = JSON.parse(sources.auditSource);
    const rolling = existing.items.find(
      (item: { rolling: boolean; sourceId?: string }) =>
        item.rolling && item.sourceId === '49649110',
    );
    audit.deactivations.push({
      sourceName: rolling.sourceName,
      sourceId: rolling.sourceId,
      sourceUrl: rolling.sourceUrl,
      deadlineAt: rolling.deadlineAt,
      status: 'EXPIRED',
      reason: 'DEADLINE_PASSED',
    });

    expect(() => validateReconciliation(existing, incoming, audit)).toThrow(
      /Rolling item needs explicit closure evidence/,
    );
  });

  it('rejects a declared expiration whose deadline had not passed at collection time', async () => {
    const sources = await fixtures();
    const existing = JSON.parse(sources.existingSource);
    const incoming = JSON.parse(sources.incomingSource);
    const audit = JSON.parse(sources.auditSource);
    const future = existing.items.find(
      (item: { sourceId?: string }) => item.sourceId === '49620106',
    );
    audit.deactivations.push({
      sourceName: future.sourceName,
      sourceId: future.sourceId,
      sourceUrl: future.sourceUrl,
      deadlineAt: future.deadlineAt,
      status: 'EXPIRED',
      reason: 'DEADLINE_PASSED',
    });

    expect(() => validateReconciliation(existing, incoming, audit)).toThrow(
      /deadline has not passed/,
    );
  });
});
