import { describe, expect, it } from 'vitest';
import { normalizeDeadline, parseJobList, parseSubmissionTitle } from './job-list.mjs';

const job = (overrides = {}) => ({
  companyName: '카카오',
  title: '2026 하반기 신입 백엔드 개발자',
  sourceName: 'Saramin',
  sourceUrl: 'https://www.saramin.co.kr/job-search/view?rec_idx=1',
  deadlineAt: '2026-10-20T23:59:00+09:00',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
  ...overrides,
});

describe('job alert submission titles', () => {
  it('accepts five collectors, three reviewers, and an explicit send', () => {
    expect(parseSubmissionTitle('[JOB-ALERT][2026-10-01][collector-5]')).toEqual({
      kind: 'collector',
      slot: 5,
      date: '2026-10-01',
    });
    expect(parseSubmissionTitle('[JOB-ALERT][2026-10-01][reviewer-3]')).toMatchObject({
      kind: 'reviewer',
      slot: 3,
    });
    expect(parseSubmissionTitle('[JOB-ALERT][2026-10-01][send]')).toEqual({
      kind: 'send',
      date: '2026-10-01',
    });
  });

  it('ignores unknown slots and unrelated issues', () => {
    expect(parseSubmissionTitle('[JOB-ALERT][2026-10-01][collector-6]')).toBeNull();
    expect(parseSubmissionTitle('[JOB-ALERT][2026-10-01][reviewer-4]')).toBeNull();
    expect(parseSubmissionTitle('[CG-JOBS-V5][2026-10-01][PARTITION_1][A1]')).toBeNull();
  });
});

describe('job alert deadlines', () => {
  it.each([
    ['2026-10-15', '2026-10-15T23:59:00+09:00'],
    ['2026.10.15', '2026-10-15T23:59:00+09:00'],
    ['2026-10-15T18:00', '2026-10-15T18:00:00+09:00'],
    ['2026-10-15T18:00:00+0900', '2026-10-15T18:00:00+09:00'],
    ['2026-10-15T09:00:00Z', '2026-10-15T18:00:00+09:00'],
  ])('reads %s as a Korean deadline', (value, expected) => {
    expect(normalizeDeadline(value)).toEqual({ deadlineAt: expected, rolling: false });
  });

  it('treats rolling wording as rolling and reports unreadable text', () => {
    expect(normalizeDeadline('상시채용')).toEqual({ deadlineAt: null, rolling: true });
    expect(normalizeDeadline('10월 15일').error).toContain('10월 15일');
  });
});

describe('job alert job lists', () => {
  it('reads JSON wrapped in chat text and a code fence', () => {
    const body = `결과입니다.\n\`\`\`json\n${JSON.stringify({ jobs: [job()] })}\n\`\`\`\n끝`;
    expect(parseJobList(body).jobs).toEqual([job()]);
  });

  it('rejects only the malformed job and keeps the rest', () => {
    const result = parseJobList(
      JSON.stringify({
        jobs: [job(), { title: '회사 없음' }, job({ sourceUrl: 'ftp://example.com' })],
      }),
    );
    expect(result.jobs).toHaveLength(1);
    expect(result.rejected).toEqual([
      { index: 1, reason: 'companyName이 비어 있습니다.', title: '회사 없음' },
      { index: 2, reason: 'sourceUrl이 http(s) 주소가 아닙니다.', title: job().title },
    ]);
  });

  it('never blocks on free-text classifications', () => {
    const { jobs, rejected } = parseJobList(
      JSON.stringify({
        items: [
          job({ careerScope: '신입/경력 중 신입 트랙' }),
          job({
            sourceUrl: 'https://www.saramin.co.kr/job-search/view?rec_idx=2',
            careerScope: '확인 필요(공고 원문 참고)',
          }),
        ],
      }),
    );
    expect(rejected).toEqual([]);
    expect(jobs.map((item) => item.careerScope)).toEqual(['NEW_GRAD_ELIGIBLE', 'UNCLASSIFIED']);
  });

  it('collapses the same canonical link within one list', () => {
    const { jobs } = parseJobList(
      JSON.stringify({
        jobs: [job(), job({ sourceUrl: `${job().sourceUrl}&utm_source=newsletter` })],
      }),
    );
    expect(jobs).toHaveLength(1);
  });

  it('fails the submission only when no JSON list can be read', () => {
    expect(parseJobList('공고가 없습니다').error).toContain('JSON');
    expect(parseJobList('{"jobs": "none"}').error).toContain('jobs 배열');
  });
});
