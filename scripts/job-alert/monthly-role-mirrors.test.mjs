import { describe, expect, it } from 'vitest';
import { duplicateJobReason } from '../../deployment/sites/job-dedup.ts';
import { buildPending } from './pipeline.mjs';
const now = new Date('2026-10-19T21:00:00+09:00');
const job = (title, id, itRole) => ({
  companyName: '예시서비스',
  title,
  sourceUrl: `https://jobs.example.test/${id}`,
  deadlineAt: '2026-10-28T23:59:00+09:00',
  rolling: false,
  ...(itRole ? { itRole } : {}),
});
const pending = (jobs, sentJobs = []) => buildPending({ collectors: [{ jobs }], sentJobs, now });
describe('monthly recruitment and general IT mirrors', () => {
  it('drops a monthly AI role already sent under its department label', () => {
    const sent = job('[IT지원실] AI 플랫폼 개발 담당자 모집 (신입)', 'sent');
    const candidate = job(
      '10월 수시채용 - AI 플랫폼 개발 (신입)',
      'monthly',
      'AI 플랫폼 개발 (신입)',
    );
    expect(duplicateJobReason(candidate, sent)).not.toBeNull();
    expect(pending([candidate], [sent]).jobs).toEqual([]);
  });
  it('drops a general IT campaign already sent with its detailed IT duties', () => {
    const sent = job(
      '2027년 신입사원 공개 채용 (IT 서비스 시스템 운영 및 개발)',
      'sent-it',
      'IT 서비스 시스템 운영 및 개발 업무',
    );
    const candidate = job(
      '[예시그룹] 2027년 신입사원 공개 채용 - IT 담당',
      'general-it',
      'IT 담당',
    );
    expect(duplicateJobReason(candidate, sent)).not.toBeNull();
    expect(pending([candidate], [sent]).jobs).toEqual([]);
  });
  it('retains a different monthly specialist vacancy with the same deadline', () => {
    const sent = job('[IT지원실] AI 플랫폼 개발 담당자 모집 (신입)', 'sent-ai');
    const candidate = job('10월 수시채용 - ERP 시스템 운영 (신입)', 'erp', 'ERP 시스템 운영');
    expect(pending([candidate], [sent]).jobs).toEqual([candidate]);
  });
  it('does not turn a specific IT planning role into a general umbrella', () => {
    const sent = job('2027년 신입사원 공개 채용 - IT개발', 'development', 'IT개발');
    const candidate = job('2027년 신입사원 공개 채용 - IT기획', 'planning', 'IT기획');
    expect(pending([candidate], [sent]).jobs).toEqual([candidate]);
  });
  it('keeps a general IT campaign from a different edition', () => {
    const sent = job('2026년 신입사원 공개 채용 - IT 담당', 'prior', 'IT 담당');
    const candidate = job('2027년 신입사원 공개 채용 - IT 담당', 'next', 'IT 담당');
    expect(pending([candidate], [sent]).jobs).toEqual([candidate]);
  });
});
