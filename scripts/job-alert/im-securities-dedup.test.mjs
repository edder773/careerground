import { describe, expect, it } from 'vitest';
import { buildPending } from './pipeline.mjs';

const now = new Date('2026-10-29T13:00:00Z');
const original = {
  companyName: 'iM증권',
  title: '2026년 신입사원 채용 - IT',
  sourceName: 'Example A',
  sourceUrl: 'https://jobs.example.test/original',
  deadlineAt: '2026-11-08T23:59:00+09:00',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
  itRole: 'IT',
};
const mirror = {
  ...original,
  companyName: '아이엠증권',
  title: '2026년 신입사원 채용',
  sourceName: 'Example B',
  sourceUrl: 'https://jobs.example.test/mirror',
};
const afterSent = (candidate, sent = original) =>
  buildPending({ collectors: [{ jobs: [candidate] }], sentJobs: [sent], now });

describe('iM Securities posting aliases', () => {
  it('blocks a Korean legal-name mirror of the delivered branded IT campaign', () => {
    const result = afterSent(mirror);
    expect(result.jobs).toEqual([]);
    expect(result.skipped.alreadySent).toBe(1);
  });

  it('blocks the reverse spelling with legal-company markers', () => {
    const result = afterSent(
      { ...original, companyName: '(주)iM증권' },
      { ...mirror, companyName: '주식회사 아이엠증권' },
    );
    expect(result.jobs).toEqual([]);
    expect(result.skipped.alreadySent).toBe(1);
  });

  it('deduplicates the two spellings inside one collected batch', () => {
    const result = buildPending({
      collectors: [{ jobs: [original] }, { jobs: [mirror] }],
      sentJobs: [],
      now,
    });
    expect(result.jobs).toEqual([original]);
    expect(result.skipped.duplicate).toBe(1);
  });

  it('keeps a different employer in the iM financial group', () => {
    const candidate = { ...mirror, companyName: '아이엠뱅크' };
    expect(afterSent(candidate).jobs).toEqual([candidate]);
  });

  it('keeps a campaign with a different recruitment year', () => {
    const candidate = { ...mirror, title: '2027년 신입사원 채용' };
    expect(afterSent(candidate).jobs).toEqual([candidate]);
  });

  it('keeps a different deadline without matching application-window evidence', () => {
    const candidate = { ...mirror, deadlineAt: '2026-11-09T23:59:00+09:00' };
    expect(afterSent(candidate).jobs).toEqual([candidate]);
  });

  it('keeps distinct specialist roles under the same employer spellings', () => {
    const sent = { ...original, title: '데이터 엔지니어 신입 채용', itRole: null };
    const candidate = { ...mirror, title: '백엔드 개발자 신입 채용', itRole: null };
    expect(afterSent(candidate, sent).jobs).toEqual([candidate]);
  });

  it('does not treat a longer, different company name as an alias', () => {
    const candidate = { ...mirror, companyName: '아이엠증권플랫폼' };
    expect(afterSent(candidate).jobs).toEqual([candidate]);
  });
});
