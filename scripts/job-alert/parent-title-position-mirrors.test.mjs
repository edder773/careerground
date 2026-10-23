import { describe, expect, it } from 'vitest';
import { buildPending } from './pipeline.mjs';

const now = new Date('2026-10-23T09:00:00+09:00');
const sent = {
  companyName: '예시디지털',
  title: '2026년 10월 예시디지털 신입사원 채용 (채용연계형 인턴십)',
  sourceUrl: 'https://jobs.example.test/digital',
  deadlineAt: '2026-11-02T18:00:00+09:00',
  rolling: false,
};
const mirror = {
  ...sent,
  companyName: '예시리테일',
  title: '2026년 10월 예시디지털 신입사원 채용 (채용연계형 인턴십) - IT',
  sourceUrl: 'https://jobs.example.test/retail',
  deadlineAt: '2026-11-02T23:59:00+09:00',
};
const pending = (jobs, sentJobs = []) => buildPending({ collectors: [{ jobs }], sentJobs, now });

describe('parent label mirrors with employer inside the title', () => {
  it('drops the parent-listed mirror after the hiring company campaign was sent', () => {
    expect(pending([mirror], [sent]).jobs).toEqual([]);
  });
  it('drops the hiring company mirror after the parent-listed campaign was sent', () => {
    expect(pending([sent], [mirror]).jobs).toEqual([]);
  });
  it('deduplicates both source orders within a new batch', () => {
    expect(pending([sent, mirror]).jobs).toHaveLength(1);
    expect(pending([mirror, sent]).jobs).toHaveLength(1);
  });
  it('keeps a different recruitment month or year', () => {
    for (const title of [
      mirror.title.replace('10월', '11월'),
      mirror.title.replace('2026', '2027'),
    ]) {
      expect(pending([{ ...mirror, title }], [sent]).jobs).toHaveLength(1);
    }
  });
  it('keeps different closing dates', () => {
    expect(
      pending([{ ...mirror, deadlineAt: '2026-11-03T18:00:00+09:00' }], [sent]).jobs,
    ).toHaveLength(1);
  });
  it('keeps a different hiring company or specific role', () => {
    const specialist = { ...sent, title: '2026년 예시디지털 AI 플랫폼 개발자 채용' };
    const other = { ...mirror, title: '2026년 예시디지털 보안 관제 담당자 채용' };
    expect(pending([other], [specialist]).jobs).toHaveLength(1);
    expect(pending([{ ...mirror, title: sent.title }], [sent]).jobs).toHaveLength(1);
    expect(
      pending([{ ...mirror, title: mirror.title.replaceAll('예시디지털', '다른디지털') }], [sent])
        .jobs,
    ).toHaveLength(1);
  });
});
