import { describe, expect, it } from 'vitest';
import { duplicateJobReason } from '../../deployment/sites/job-dedup.ts';
import { buildPending } from './pipeline.mjs';

const now = new Date('2026-10-14T21:00:00+09:00');
const job = (title, id) => ({
  companyName: '예시금속',
  title,
  sourceUrl: `https://jobs.example.test/${id}`,
  deadlineAt: '2026-10-20T23:59:00+09:00',
  rolling: false,
});
const pending = (jobs, sentJobs = []) => buildPending({ collectors: [{ jobs }], sentJobs, now });

const systems = job('2026년 4분기 수시채용 - 전산시스템 개발/운영 신입/경력사원 모집', 'systems');
const ai = job('2026년 4분기 수시채용 - AI 솔루션 개발/운영 신입/경력사원 모집', 'ai');

describe('specific role recruitment deduplication', () => {
  it('keeps separate systems and AI vacancies in one recruitment window', () => {
    expect(duplicateJobReason(systems, ai)).toBeNull();
    expect(pending([systems, ai]).jobs).toHaveLength(2);
  });
  it('keeps an AI vacancy after the systems vacancy was sent', () => {
    expect(pending([ai], [systems]).jobs).toEqual([ai]);
  });
  it('keeps separate ERP and AI vacancies despite quarter and experience wording', () => {
    const erp = job('2026년 2분기 수시채용 - ERP 개발/운영 신입/경력사원 모집', 'erp');
    const candidate = job('2026년 2분기 수시채용 - AI 솔루션 개발/운영 신입/경력사원 모집', 'ai2');
    expect(pending([erp, candidate]).jobs).toHaveLength(2);
  });
  it('does not classify AI development and operations as a multi-domain umbrella', () => {
    const first = job('2026년 신입 개발자 채용 - 전산시스템 개발 운영', 'systems2');
    const second = job('2026년 신입 개발자 채용 - AI 솔루션 개발 운영', 'ai3');
    expect(pending([first, second]).jobs).toHaveLength(2);
  });
  it('still drops the same AI role mirrored on another source', () => {
    const mirror = job('2026년 4분기 수시채용 - AI 솔루션 개발 운영 신입·경력사원 모집', 'mirror');
    expect(pending([ai, mirror]).jobs).toHaveLength(1);
  });
  it('still drops a detail already covered by an IT/SW/AI umbrella', () => {
    const umbrella = job('2026년 4분기 신입사원 수시채용 IT/SW/AI', 'umbrella');
    expect(pending([ai], [umbrella]).jobs).toEqual([]);
  });
});
