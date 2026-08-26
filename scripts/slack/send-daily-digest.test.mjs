import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { getKoreanDispatchDecision } from './korean-business-day.mjs';
import { formatSlackMessages, sendDailyDigest } from './send-daily-digest.mjs';

const BAEUMZIP_URL = 'https://www.baeumzip.site/';
const BUSINESS_DAY = () => new Date('2026-08-21T00:00:00.000Z');

const payload = {
  date: '2026-08-21',
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
      title: '네트워크',
      track: 'ALGORITHM',
      level: 3,
      isChallenge: true,
      sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/43162',
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

const claimed = (value = payload) =>
  new globalThis.Response(
    JSON.stringify({
      status: 'claimed',
      deliveryKey: `daily:${value.date}`,
      claimToken: 'claim-token',
      attemptCount: 1,
      payload: value,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

const ok = () => new globalThis.Response('ok', { status: 200 });

describe('daily Slack digest', () => {
  it('shows the digest date, links coding-test titles, and omits an empty jobs section', () => {
    const messages = formatSlackMessages(payload, { baeumzipUrl: BAEUMZIP_URL });
    const [message] = messages;
    const rendered = JSON.stringify(message);
    expect(message.text).toBe('2026년 8월 21일 기준 CareerGround 새 알림');
    expect(message.blocks[0].text.text).toBe('2026년 8월 21일 기준 새로운 알림');
    expect(rendered).toContain(
      '<https://school.programmers.co.kr/learn/courses/30/lessons/12935|제일 작은 수 제거하기>',
    );
    expect(rendered).not.toContain('문제 열기');
    expect(rendered).toContain(
      '<https://school.programmers.co.kr/learn/courses/30/lessons/43162|(도전 문제) 네트워크>',
    );
    expect(rendered.indexOf('(도전 문제) 네트워크')).toBeLessThan(
      rendered.indexOf('식품분류별 가장 비싼 식품의 정보 조회하기'),
    );
    expect(rendered).toContain('<https://careerground.example/|코딩테스트·채용공고 전체 보기 →>');
    expect(rendered).toContain('<https://www.baeumzip.site/|자격증 &amp; SW 전공 테스트 준비 →>');
    expect(rendered).not.toContain('신규 채용 알림 공고');
    expect(rendered).toContain('🔥 *오늘의 코딩 테스트*');
    expect(rendered).not.toContain('💼');
    expect(messages).toHaveLength(1);
  });

  it('rejects a digest whose challenge-only Lv.3 item is missing or out of order', () => {
    expect(() =>
      formatSlackMessages(
        {
          ...payload,
          challenges: payload.challenges.filter((challenge) => !challenge.isChallenge),
        },
        { baeumzipUrl: BAEUMZIP_URL },
      ),
    ).toThrow('Slack 코딩테스트는 4개여야 합니다');
    expect(() =>
      formatSlackMessages(
        {
          ...payload,
          challenges: [
            payload.challenges[0],
            payload.challenges[2],
            payload.challenges[1],
            payload.challenges[3],
          ],
        },
        { baeumzipUrl: BAEUMZIP_URL },
      ),
    ).toThrow('Slack 코딩테스트 순서는 Lv.1, Lv.2, 도전 Lv.3, SQL이어야 합니다.');
  });

  it('keeps every linked job in one message below a divider with restrained decoration', () => {
    const jobs = Array.from({ length: 40 }, (_, index) => ({
      company: `회사 ${index + 1}`,
      title: `신입 백엔드 개발자 채용 ${index + 1}`,
      deadlineAt: '2026-08-27T01:00:00.000Z',
      sourceName: '채용 홈페이지',
      sourceUrl: `https://example.com/jobs/${index + 1}`,
    }));
    const messages = formatSlackMessages({ ...payload, jobs }, { baeumzipUrl: BAEUMZIP_URL });
    const rendered = JSON.stringify(messages);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe('2026년 8월 21일 기준 CareerGround 새 알림');
    expect(rendered).toContain(
      '<https://example.com/jobs/40|회사 40 — 신입 백엔드 개발자 채용 40>',
    );
    expect(rendered).not.toContain('원문 보기');
    expect(rendered.match(/🔥|💼/gu)).toHaveLength(2);
    expect(rendered).toContain('🔥 *오늘의 코딩 테스트*');
    expect(rendered).toContain('💼 *신규 채용 알림 공고 · 40건*');
    expect(rendered).toContain('직전 일일 알림 이후 새롭게 등록된 마감일 확정 공고입니다.');
    expect(rendered).toContain('배움집');
    const blocks = messages[0].blocks;
    const jobsHeadingIndex = blocks.findIndex(
      (block) => block.type === 'section' && block.text?.text === '💼 *신규 채용 알림 공고 · 40건*',
    );
    expect(blocks[jobsHeadingIndex - 1]).toEqual({ type: 'divider' });
  });

  it('replays one imported snapshot as a jobs-only bot message', () => {
    const messages = formatSlackMessages(
      {
        ...payload,
        snapshotCreatedAt: '2026-08-24T14:34:04.000Z',
        jobs: [
          {
            company: 'NHN Cloud',
            title: '스토리지 엔진 개발',
            deadlineAt: null,
            rolling: 1,
            sourceName: 'NHN Careers',
            sourceUrl: 'https://careers.nhn.com/recruits/1',
          },
        ],
      },
      { baeumzipUrl: BAEUMZIP_URL, jobsOnly: true },
    );
    const rendered = JSON.stringify(messages);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe('2026년 8월 24일 23:34 final:latest CareerGround 채용 알림');
    expect(rendered).toContain('신규 채용 알림 공고 · 1건');
    expect(rendered).toContain('채용 시 마감 · NHN Careers');
    expect(rendered).not.toContain('오늘의 코딩 테스트');
  });

  it('runs at 08:01 on weekdays in the Seoul timezone', async () => {
    const workflow = await readFile(
      new URL('../../.github/workflows/daily-slack-digest.yml', import.meta.url),
      'utf8',
    );
    expect(workflow).toContain("cron: '1 8 * * 1-5'");
    expect(workflow).toContain("timezone: 'Asia/Seoul'");
    expect(workflow).not.toContain("cron: '0 8 * * 1-5'");
    expect(workflow).not.toContain("cron: '0 7 * * 1-5'");
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
      .mockResolvedValueOnce(claimed())
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok());
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
    const claimUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(claimUrl.pathname).toBe('/api/v1/internal/slack-digest/claim');
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer service-token' }),
      }),
    );
    const slackPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(slackPayload.text).toBe('2026년 8월 21일 기준 CareerGround 새 알림');
    expect(slackPayload.blocks).toEqual(expect.any(Array));
  });

  it('posts coding tests and jobs as one Slack message', async () => {
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
      .mockResolvedValueOnce(claimed({ ...payload, jobs }))
      .mockResolvedValue(ok());

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

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const slackPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(slackPayload.text).toBe('2026년 8월 21일 기준 CareerGround 새 알림');
    expect(JSON.stringify(slackPayload)).toContain('신규 채용 알림 공고 · 1건');
  });

  it('allows a manual forced send on a public holiday', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(claimed())
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok());

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

  it('requests an exact snapshot for a jobs-only replay', async () => {
    const snapshotCreatedAt = '2026-08-24T14:34:04.000Z';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        claimed({
          ...payload,
          snapshotCreatedAt,
          jobs: [
            {
              company: '스냅샷 회사',
              title: '신입 개발자',
              deadlineAt: '2026-09-01T14:59:59.000Z',
              rolling: 0,
              sourceName: '공식 채용',
              sourceUrl: 'https://example.com/jobs/snapshot',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok());

    await expect(
      sendDailyDigest(
        {
          CAREERGROUND_DIGEST_URL: 'https://careerground.example/api/v1/internal/slack-digest',
          CAREERGROUND_DIGEST_TOKEN: 'service-token',
          SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T000/B000/secret',
          BAEUMZIP_URL,
          SLACK_DIGEST_FORCE_SEND: 'true',
          SLACK_DIGEST_SNAPSHOT_CREATED_AT: snapshotCreatedAt,
          SLACK_DIGEST_JOBS_ONLY: 'true',
        },
        fetchMock,
        BUSINESS_DAY,
      ),
    ).resolves.toEqual({ messageCount: 1 });
    const requested = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requested.pathname).toBe('/api/v1/internal/slack-digest/claim');
    const claimBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(claimBody).toEqual({ snapshotCreatedAt, jobsOnly: true });
    const slackPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(slackPayload.text).toContain('final:latest CareerGround 채용 알림');
    expect(JSON.stringify(slackPayload)).not.toContain('오늘의 코딩 테스트');
  });

  it('skips a digest that the database already marked as sent', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new globalThis.Response(
          JSON.stringify({ status: 'already-sent', deliveryKey: 'daily:2026-08-21' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

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
    ).resolves.toMatchObject({ messageCount: 0, skipped: { reason: 'already-sent' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('marks an ambiguous Slack network failure as uncertain instead of retryable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(claimed())
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce(ok());

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
    ).rejects.toThrow('network timeout');
    const failUrl = new URL(String(fetchMock.mock.calls[2][0]));
    expect(failUrl.pathname).toBe('/api/v1/internal/slack-digest/fail');
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({ uncertain: true });
  });
});
