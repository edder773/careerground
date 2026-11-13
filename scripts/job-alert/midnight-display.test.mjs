import { expect, it } from 'vitest';
import { buildAlertMessage } from './slack-message.mjs';
const render = (deadlineAt) =>
  JSON.stringify(
    buildAlertMessage({
      date: '2026-11-13',
      jobs: [
        {
          companyName: '회사',
          title: '개발',
          sourceUrl: 'https://example.com/job',
          sourceName: '공고',
          deadlineAt,
        },
      ],
      challenges: [],
      heldCount: 0,
      siteUrl: 'https://example.com',
      baeumzipUrl: 'https://example.com',
    }),
  );
it('renders midnight as the equivalent preceding day 24:00', () =>
  expect(render('2026-11-24T00:00:00+09:00')).toContain('마감 11월 23일 24:00'));
it('handles midnight at a year boundary', () =>
  expect(render('2027-01-01T00:00:00+09:00')).toContain('마감 12월 31일 24:00'));
it('keeps other deadline dates', () =>
  expect(render('2026-11-17T23:50:00+09:00')).toContain('마감 11월 17일 ·'));
