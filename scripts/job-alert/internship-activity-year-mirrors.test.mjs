import { describe, expect, it } from 'vitest';
import { duplicateJobReason } from '../../deployment/sites/job-dedup.ts';
import { buildPending } from './pipeline.mjs';
const job = (title, id, deadlineAt = '2026-10-26T17:00:00+09:00') => ({
  companyName: '예시은행',
  title,
  sourceUrl: `https://jobs.example.test/${id}`,
  deadlineAt,
  rolling: false,
});
const prior = job('2026년 채용연계형 인턴십 - Tech', 'prior');
const next = job('2027 채용연계형 인턴십 (Biz · Marketing분야, Tech분야)', 'next');
const now = new Date('2026-10-20T21:00:00+09:00');
describe('internship activity-year mirrors', () => {
  it('matches an activity-year label to the application-year mirror', () => {
    expect(duplicateJobReason(next, prior)).not.toBeNull();
    expect(buildPending({ collectors: [{ jobs: [next] }], sentJobs: [prior], now }).jobs).toEqual(
      [],
    );
  });
  it('ignores the English role field-label suffix in the same year', () => {
    expect(
      duplicateJobReason(job('2026년 채용연계형 인턴십 - Tech분야', 'field'), prior),
    ).not.toBeNull();
  });
  it('keeps different annual editions of full-time recruitment', () => {
    expect(
      duplicateJobReason(
        job('2027년 신입사원 공개채용 - IT', 'new'),
        job('2026년 신입사원 공개채용 - IT', 'old'),
      ),
    ).toBeNull();
  });
  it('keeps internship years unrelated to the application deadline year', () => {
    expect(
      duplicateJobReason(
        job('2028 채용연계형 인턴십 - Tech', 'future'),
        job('2027 채용연계형 인턴십 - Tech', 'activity'),
      ),
    ).toBeNull();
  });
  it('keeps different specialist roles even with application/activity years', () => {
    expect(
      duplicateJobReason(
        job('2027 채용연계형 인턴십 - IT기획', 'plan'),
        job('2026 채용연계형 인턴십 - 임베디드개발', 'embedded'),
      ),
    ).toBeNull();
  });
  it('requires exactly the same application deadline for conflicting years', () => {
    const other = job(next.title, 'other-deadline', '2026-10-27T17:00:00+09:00');
    expect(duplicateJobReason(other, prior)).toBeNull();
  });
});
