import { describe, expect, it, vi } from 'vitest';
import type { JobImport } from '@careerground/contracts';
import {
  analyzeJobImport,
  canonicalizeJobUrl,
  normalizeCompany,
  parseCsvBoolean,
} from './jobs-domain.js';
import { JobsService } from './jobs.service.js';

const base: JobImport = {
  version: '1.0',
  collectedAt: '2026-08-12T00:00:00.000Z',
  sourceCount: 1,
  items: [
    {
      sourceName: 'demo',
      sourceUrl: 'https://jobs.example.com/1?utm_source=test',
      companyName: '(주) 데모',
      title: '백엔드 신입',
      category: '백엔드',
      careerScope: 'NEW_GRAD_ONLY',
      careerEvidence: '신입',
      companySize: 'SMALL',
      employmentType: 'FULL_TIME',
      region: '서울',
      remote: false,
      techStack: ['TypeScript'],
      rolling: false,
      collectedAt: '2026-08-12T00:00:00.000Z',
      lastVerifiedAt: '2026-08-12T00:00:00.000Z',
      summary: 'demo',
      status: 'ACTIVE',
    },
  ],
};

describe('job import policy', () => {
  it('rejects career-only rows without silently importing them', () => {
    const input = structuredClone(base);
    input.items[0]!.careerScope = 'CAREER_ONLY';
    expect(analyzeJobImport(input).counts.rejected).toBe(1);
  });

  it('normalizes companies and canonical URLs for deduplication', () => {
    expect(normalizeCompany('(주) 데모')).toBe(normalizeCompany('주식회사 데모'));
    expect(canonicalizeJobUrl(base.items[0]!.sourceUrl)).toBe('https://jobs.example.com/1');
  });

  it('marks an identical import URL as an update', () => {
    const existing = new Set([canonicalizeJobUrl(base.items[0]!.sourceUrl)]);
    expect(analyzeJobImport(base, existing).counts.update).toBe(1);
  });

  it('parses common CSV boolean variants without truthy string coercion', () => {
    for (const value of ['true', '1', 'yes', 'Y', 't', '예', '네']) {
      expect(parseCsvBoolean(value, 'remote')).toBe(true);
    }
    for (const value of ['false', '0', 'no', 'N', 'f', '아니오', '아니요', '']) {
      expect(parseCsvBoolean(value, 'remote')).toBe(false);
    }
    expect(() => parseCsvBoolean('sometimes', 'remote')).toThrow(/remote/);
  });

  it('returns the original batch when the same checksum is committed again', async () => {
    const transaction = vi.fn();
    const previous = { id: 'existing-batch', checksum: 'same' };
    const prisma = {
      jobImportBatch: { findUnique: async () => previous },
      $transaction: transaction,
    };
    const service = new JobsService(prisma as never, {} as never);
    await expect(service.commit('admin-id', base)).resolves.toEqual({
      batch: previous,
      idempotent: true,
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});
