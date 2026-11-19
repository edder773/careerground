import { describe, expect, it } from 'vitest';
import { buildPending } from './pipeline.mjs';

const sent = {
  companyName: '당근',
  title: '[2027 당근 프로덕트 빌더 인턴십] Software Engineer, Backend (채용전환형) - 피드 인프라',
  sourceUrl: 'https://example.test/sent',
  deadlineAt: '2026-12-06T23:59:00+09:00',
  rolling: false,
};
const mirror = {
  ...sent,
  companyName: '주식회사 당근마켓',
  title: 'Software Engineer, Backend (채용전환형) - 피드 인프라',
  sourceUrl: 'https://example.test/mirror',
};
const evaluate = (job, prior = sent) =>
  buildPending({
    collectors: [{ jobs: [job] }],
    sentJobs: [prior],
    now: new Date('2026-11-19T13:00:00Z'),
  });
describe('Daangn company and team mirror', () => {
  it('blocks the already delivered feed team under its legal name', () =>
    expect(evaluate(mirror).skipped.alreadySent).toBe(1));
  it('blocks the reverse spelling', () =>
    expect(evaluate(sent, mirror).skipped.alreadySent).toBe(1));
  it('keeps a different team', () =>
    expect(
      evaluate({ ...mirror, title: mirror.title.replace('피드 인프라', '커뮤니티') }).jobs,
    ).toHaveLength(1));
  it('keeps a different deadline', () =>
    expect(evaluate({ ...mirror, deadlineAt: '2027-01-20T23:59:00+09:00' }).jobs).toHaveLength(1));
  it('keeps a different recruitment year', () =>
    expect(
      evaluate({ ...mirror, title: '[2028 당근 프로덕트 빌더 인턴십] ' + mirror.title }).jobs,
    ).toHaveLength(1));
  it('keeps another company', () =>
    expect(evaluate({ ...mirror, companyName: '당근페이' }).jobs).toHaveLength(1));
});
