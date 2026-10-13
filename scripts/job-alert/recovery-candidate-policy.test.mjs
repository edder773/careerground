import { describe, expect, it } from 'vitest';
import { buildPending } from './pipeline.mjs';
const now = new Date('2026-10-13T21:00:00+09:00');
const job = (companyName, title, id, itRole = null) => ({
  companyName,
  title,
  itRole,
  sourceUrl: `https://jobs.example.test/posting/${id}`,
  deadlineAt: '2026-10-30T23:59:00+09:00',
  rolling: false,
});
const pending = (candidate, sentJobs = []) =>
  buildPending({ collectors: [{ jobs: [candidate] }], sentJobs, now });

describe('recovery candidate names and eligibility', () => {
  it.each(['Fasoo AI', '파수 AI', '파수에이아이'])(
    'recognizes the same sent SW campaign under %s',
    (companyName) => {
      const sent = job('파수에이아이', '2026년 3차 신입 공개 채용 (SW개발)', 1, 'SW개발');
      const candidate = job(companyName, '2026년 3차 신입 공개 채용', 2, 'SW개발(AI, 보안)');
      expect(pending(candidate, [sent]).jobs).toEqual([]);
      expect(pending(candidate, [sent]).skipped.alreadySent).toBe(1);
    },
  );
  it('keeps a different specialist opening at the same company', () => {
    const sent = job('파수에이아이', '신입 서버 개발자', 1, '서버 개발');
    const candidate = job('Fasoo AI', '신입 네트워크 인프라 엔지니어', 2, '네트워크 인프라');
    expect(pending(candidate, [sent]).jobs).toEqual([candidate]);
  });
  it('does not treat the hospital employer label as restricted eligibility', () => {
    const candidate = job('한국보훈복지의료공단', '[부산보훈병원] 정규직 전산 채용', 1, '전산');
    expect(pending(candidate).jobs).toEqual([candidate]);
  });
  it.each(['보훈 대상자 제한경쟁 전산 채용', '장애인 제한경쟁 전산 채용'])(
    'still blocks explicit protected eligibility: %s',
    (title) => {
      const candidate = job('한국보훈복지의료공단', `[부산보훈병원] ${title}`, 1, '전산');
      expect(pending(candidate).jobs).toEqual([]);
      expect(pending(candidate).skipped.restricted).toBe(1);
    },
  );
});
