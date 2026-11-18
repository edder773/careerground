import { describe, expect, it } from 'vitest';
import { buildPending } from './pipeline.mjs';

const sent = {
  companyName: '엘에스아이티씨(주)',
  title: '2027 LS ITC 채용연계형 인턴 모집',
  sourceName: 'JobKorea',
  sourceUrl: 'https://example.test/a',
  deadlineAt: '2026-11-29T23:50:00+09:00',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
};
const candidate = {
  ...sent,
  companyName: 'LS ITC',
  sourceName: 'Inthiswork',
  sourceUrl: 'https://example.test/b',
  deadlineAt: '2026-11-29T23:59:00+09:00',
};
const pending = (job, prior = sent) =>
  buildPending({
    collectors: [{ jobs: [job] }],
    sentJobs: [prior],
    now: new Date('2026-11-18T13:00:00Z'),
  });

describe('LS ITC legal and brand names', () => {
  it('suppresses the same delivered campaign across company spellings and sources', () => {
    expect(pending(candidate).skipped.alreadySent).toBe(1);
  });
  it('suppresses the reverse company spelling', () => {
    expect(pending(sent, candidate).skipped.alreadySent).toBe(1);
  });
  it('retains a different company', () => {
    expect(pending({ ...candidate, companyName: 'LS ELECTRIC' }).jobs).toHaveLength(1);
  });
  it('retains a different application deadline', () => {
    expect(pending({ ...candidate, deadlineAt: '2026-12-30T23:59:00+09:00' }).jobs).toHaveLength(1);
  });
  it('retains a different recruitment year', () => {
    expect(pending({ ...candidate, title: '2028 LS ITC 채용연계형 인턴 모집' }).jobs).toHaveLength(
      1,
    );
  });
});
