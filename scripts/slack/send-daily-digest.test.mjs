import { describe, expect, it, vi } from 'vitest';
import { formatSlackMessages, sendDailyDigest } from './send-daily-digest.mjs';

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
  it('links coding tests directly to Programmers and omits an empty jobs section', () => {
    const [message] = formatSlackMessages(payload);
    expect(message).toContain('오늘의 코딩 테스트');
    expect(message).toContain('school.programmers.co.kr/learn/courses/30/lessons/12935');
    expect(message).not.toContain('신규 채용 알림 공고');
  });

  it('includes every dated non-rolling job and splits oversized messages', () => {
    const jobs = Array.from({ length: 40 }, (_, index) => ({
      company: `회사 ${index + 1}`,
      title: `신입 백엔드 개발자 채용 ${index + 1}`,
      deadlineAt: '2026-08-27T01:00:00.000Z',
      sourceName: '채용 홈페이지',
      sourceUrl: `https://example.com/jobs/${index + 1}`,
    }));
    const messages = formatSlackMessages({ ...payload, jobs });
    expect(messages.length).toBeGreaterThan(1);
    expect(messages.every((message) => message.length <= 3_800)).toBe(true);
    expect(messages.join('\n')).toContain('회사 40');
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
        },
        fetchMock,
      ),
    ).resolves.toEqual({ messageCount: 1 });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://careerground.example/api/v1/internal/slack-digest',
      expect.objectContaining({ headers: { authorization: 'Bearer service-token' } }),
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).text).not.toContain('신규 채용 알림 공고');
  });
});
