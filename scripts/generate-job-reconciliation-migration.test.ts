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
      removedItems: 0,
      retainedUnconfirmedItems: 0,
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

  it('supports evidence-backed removal and runtime-selected migration identifiers', async () => {
    const sources = await fixtures();
    const existing = JSON.parse(sources.existingSource);
    const incoming = JSON.parse(sources.incomingSource);
    const audit = JSON.parse(sources.auditSource);
    const removable = existing.items.find(
      (item: { rolling: boolean; sourceId?: string }) =>
        !item.rolling &&
        !incoming.items.some(
          (candidate: { sourceName: string; sourceId?: string }) =>
            candidate.sourceName === item.sourceName && candidate.sourceId === item.sourceId,
        ) &&
        !audit.deactivations.some(
          (candidate: { sourceName: string; sourceId?: string }) =>
            candidate.sourceName === item.sourceName && candidate.sourceId === item.sourceId,
        ),
    );
    audit.removals = [
      {
        sourceName: removable.sourceName,
        sourceId: removable.sourceId,
        sourceUrl: removable.sourceUrl,
        status: 'REMOVED',
        reason: 'SOURCE_REMOVED',
        checkedAt: audit.reconciledAt,
        evidence: '원본 공고가 삭제된 것을 재검증함',
      },
    ];
    audit.comparison.removedItems = 1;
    audit.comparison.visibleItemsAfter -= 1;

    const result = generateReconciliationSql({
      existingSource: JSON.stringify(existing),
      incomingSource: JSON.stringify(incoming),
      auditSource: JSON.stringify(audit),
      migrationVersion: '0042_reconcile_job_catalog_20260901',
      batchId: 'catalog-jobs-20260901-full',
    });

    expect(result.sql).toContain("SET status = 'REMOVED'");
    expect(result.sql).toContain('catalog-jobs-20260901-full');
    expect(result.sql).toContain('0042_reconcile_job_catalog_20260901');
  });

  it('requires an explicit decision for every previous visible job in full revalidation mode', () => {
    const item = {
      sourceName: 'Example',
      sourceId: '1',
      sourceUrl: 'https://example.com/jobs/1',
      companyName: 'Example Company',
      title: '신입 백엔드 개발자',
      category: 'BACKEND',
      careerScope: 'NEW_GRAD_ONLY',
      careerEvidence: '신입 지원 가능이 명시됨',
      companySize: 'UNCLASSIFIED',
      companySizeEvidence: '공개 근거 없음',
      employmentType: 'FULL_TIME',
      region: '서울',
      remote: false,
      techStack: [],
      publishedAt: null,
      applicationStartAt: null,
      deadlineAt: '2026-09-30T23:59:59+09:00',
      rolling: false,
      collectedAt: '2026-09-01T06:00:00+09:00',
      lastVerifiedAt: '2026-09-01T06:10:00+09:00',
      summary: '신입 백엔드 개발자 채용 공고',
      status: 'ACTIVE',
    };
    const existing = {
      version: '1.0',
      collectedAt: item.collectedAt,
      sourceCount: 1,
      items: [item],
    };
    const newItem = {
      ...item,
      sourceId: '2',
      sourceUrl: 'https://example.com/jobs/2',
      title: '신입 프론트엔드 개발자',
    };
    const incoming = {
      version: '1.0',
      asOfDate: '2026-09-01',
      timezone: 'Asia/Seoul',
      collectedAt: item.collectedAt,
      sourceCount: 1,
      items: [newItem],
    };
    const audit = {
      version: '1.0',
      asOfDate: '2026-09-01',
      reconciledAt: '2026-09-01T06:30:00+09:00',
      snapshotMode: 'FULL_REVALIDATION',
      comparison: {},
      deactivations: [],
      removals: [],
      rollingVerification: [],
    };

    expect(() => validateReconciliation(existing, incoming, audit)).toThrow(
      /explicit decision for every existing visible job/,
    );
  });
});
