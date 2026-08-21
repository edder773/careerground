import { describe, expect, it, vi } from 'vitest';
import { getKoreanDispatchDecision } from './korean-business-day.mjs';
import { formatSlackMessages, sendDailyDigest } from './send-daily-digest.mjs';

const BAEUMZIP_URL = 'https://www.baeumzip.site/';
const BUSINESS_DAY = () => new Date('2026-08-21T00:00:00.000Z');

const payload = {
  siteUrl: 'https://careerground.example/',
  challenges: [
    {
      title: '제일 작은 수 제거하기',
      track: 'ALGORITHM',
      level: 1,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/12935',
    },
    {
      title: '멀리 뛰기',
      track: 'ALGORITHM',
      level: 2,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/12914',
    },
    {
      title: '식품분류별 가장 비싼 식품의 정보 조회하기',
      track: 'SQL',
      level: 4,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/131116',
    },
  ],
  jobs: [],
};

describe('daily Slack digest', () => {
  it('links coding-test titles directly to Programmers and omits an empty jobs message', () => {
    const messages = formatSlackMessages(payload, { baeumzipUrl: BAEUMZIP_URL });
    const [message] = messages;
    const rendered = JSON.stringify(message);
    expect(message.text).toBe('오늘의 코딩 테스트');
    expect(rendered).toContain(
      '<https://school.programmers.co.kr/learn/courses/30/lessons/12935|제일 작은 수 제거하기>',
    );
    expect(rendered).not.toContain('문제 열기');
    expect(rendered).toContain('<https://careerground.example/|코딩테스트·채용공고 전체 보기 →>');
    expect(rendered).toContain('<https://www.baeumzip.site/|자격증 &amp; SW 전공 테스트 준비 →>');
    expect(messages).toHaveLength(1);
  });

  it('sends every job in one separate message with linked titles and restrained icons', () => {
    const jobs = Array.from({ length: 40 }, (_, index) => ({
      company: `회사 ${index + 1}`,
      title: `신입 백엔드 개발자 채용 ${index + 1}`,
      deadlineAt: '2026-08-27T01:00:00.000Z',
      sourceName: '채용 홈페이지',
      sourceUrl: `https://example.com/jobs/${index + 1}`,
    }));
    const messages = formatSlackMessages({ ...payload, jobs }, { baeumzipUrl: BAEUMZIP_URL });
    const rendered = JSON.stringify(messages);
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe('오늘의 코딩 테스트');
    expect(messages[1].text).toBe('신규 채용 알림 40건');
    expect(rendered).toContain(
      '<https://example.com/jobs/40|회사 40 — 신입 백엔드 개발자 채용 40>',
    );
    expect(rendered).not.toContain('원문 보기');
    expect(rendered.match(/🔥|💼/gu)).toHaveLength(2);
    expect(JSON.stringify(messages[0])).not.toContain('배움집');
    expect(JSON.stringify(messages[1])).toContain('배움집');
  });

  it('skips weekends and Korean public holidays in Seoul time', () => {
    expect(getKoreanDispatchDecision(new Date('2026-08-15T00:00:00.000Z'))).toMatchObject({
      shouldSend: false,
      reason: 'weekend',
    });
    expect(getKoreanDispatchDecision(new Date('2026-08-17T00:00:00.000Z'))).toMatchObject({
      shouldSend: false,
      reason: 'public-holiday',
      holidayName: '광복절 대체공휴일',
    });
    expect(getKoreanDispatchDecision(BUSINESS_DAY())).toEqual({
      shouldSend: true,
      dateKey: '2026-08-21',
    });
  });

  it('does not fetch data or post to Slack on a public holiday', async () => {
    const fetchMock = vi.fn();
    await expect(
      sendDailyDigest({}, fetchMock, () => new Date('2026-08-17T00:00:00.000Z')),
    ).resolves.toMatchObject({
      messageCount: 0,
      skipped: { reason: 'public-holiday', holidayName: '광복절 대체공휴일' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches the protected digest and posts the formatted payload to Slack', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new globalThis.Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new globalThis.Response('ok', { status: 200 }));
    await expect(
      sendDailyDigest(
        {
          CAREERGROUND_DIGEST_URL: 'https://careerground.example/api/v1/internal/slack-digest',
          CAREERGROUND_DIGEST_TOKEN: 'service-token',
          SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T000/B000/secret',
          BAEUMZIP_URL,
        },
        fetchMock,
        BUSINESS_DAY,
      ),
    ).resolves.toEqual({ messageCount: 1 });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://careerground.example/api/v1/internal/slack-digest',
      expect.objectContaining({ headers: { authorization: 'Bearer service-token' } }),
    );
    const slackPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(slackPayload.text).toBe('오늘의 코딩 테스트');
    expect(slackPayload.blocks).toEqual(expect.any(Array));
  });

  it('posts coding tests and jobs as two Slack messages', async () => {
    const jobs = [
      {
        company: 'NAVER',
        title: 'AI 연구 개발 체험형 인턴',
        deadlineAt: '2026-08-27T01:00:00.000Z',
        sourceName: 'NAVER Careers',
        sourceUrl: 'https://recruit.navercorp.com/jobs/1',
      },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new globalThis.Response(JSON.stringify({ ...payload, jobs }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValue(new globalThis.Response('ok', { status: 200 }));

    await expect(
      sendDailyDigest(
        {
          CAREERGROUND_DIGEST_URL: 'https://careerground.example/api/v1/internal/slack-digest',
          CAREERGROUND_DIGEST_TOKEN: 'service-token',
          SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T000/B000/secret',
          BAEUMZIP_URL,
        },
        fetchMock,
        BUSINESS_DAY,
      ),
    ).resolves.toEqual({ messageCount: 2 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).text).toBe('오늘의 코딩 테스트');
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).text).toBe('신규 채용 알림 1건');
  });

  it('allows a manual forced send on a public holiday', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new globalThis.Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new globalThis.Response('ok', { status: 200 }));

    await expect(
      sendDailyDigest(
        {
          CAREERGROUND_DIGEST_URL: 'https://careerground.example/api/v1/internal/slack-digest',
          CAREERGROUND_DIGEST_TOKEN: 'service-token',
          SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T000/B000/secret',
          BAEUMZIP_URL,
          SLACK_DIGEST_FORCE_SEND: 'true',
        },
        fetchMock,
        () => new Date('2026-08-17T00:00:00.000Z'),
      ),
    ).resolves.toEqual({ messageCount: 1 });
  });
});
