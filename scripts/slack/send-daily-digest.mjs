import process from 'node:process';
import { URL, pathToFileURL } from 'node:url';
import { getKoreanDispatchDecision } from './korean-business-day.mjs';

const MAX_SECTION_LENGTH = 2_800;

const escapeSlackText = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const slackUrl = (value, label) => {
  const url = new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP(S) 링크만 허용됩니다.');
  const safeLabel = escapeSlackText(label).replaceAll('|', '｜');
  return `<${url.toString().replaceAll('|', '%7C').replaceAll('>', '%3E')}|${safeLabel}>`;
};

const deadlineLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('채용공고 마감일이 올바르지 않습니다.');
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const snapshotLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('스냅샷 반영 시각이 올바르지 않습니다.');
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const digestDateLabel = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new Error('알림 기준일이 올바르지 않습니다.');
  }
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) throw new Error('알림 기준일이 올바르지 않습니다.');
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const challengeText = (challenge) => {
  const track = challenge.track === 'SQL' ? 'SQL' : '알고리즘';
  const title = challenge.isChallenge ? `(도전 문제) ${challenge.title}` : challenge.title;
  return [
    `• *${slackUrl(challenge.sourceUrl, title)}*`,
    `  ${track} · Lv.${Number(challenge.level)}`,
  ].join('\n');
};

const jobText = (job) => {
  const availability = job.deadlineAt
    ? `마감 ${deadlineLabel(job.deadlineAt)}`
    : job.rolling
      ? '채용 시 마감'
      : '마감일 미정';
  return [
    `• *${slackUrl(job.sourceUrl, `${job.company} — ${job.title}`)}*`,
    `  ${availability} · ${escapeSlackText(job.sourceName)}`,
  ].join('\n');
};

const packSectionText = (entries) => {
  const sections = [];
  let current = '';

  for (const entry of entries) {
    if (entry.length > MAX_SECTION_LENGTH) {
      throw new Error('Slack 항목이 허용된 섹션 길이를 초과했습니다.');
    }
    const candidate = current ? `${current}\n\n${entry}` : entry;
    if (candidate.length > MAX_SECTION_LENGTH) {
      sections.push(current);
      current = entry;
    } else {
      current = candidate;
    }
  }
  if (current) sections.push(current);
  return sections;
};

const section = (text) => ({
  type: 'section',
  text: { type: 'mrkdwn', text },
});

const serviceLinks = ({ careergroundUrl, baeumzipUrl }) => ({
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: `*CareerGround*\n${slackUrl(careergroundUrl, '코딩테스트·채용공고 전체 보기 →')}`,
    },
    {
      type: 'mrkdwn',
      text: `*배움집*\n${slackUrl(baeumzipUrl, '자격증 & SW 전공 테스트 준비 →')}`,
    },
  ],
});

const buildDigestMessage = ({ date, siteUrl, challenges, jobs }, { baeumzipUrl }) => {
  const dateLabel = digestDateLabel(date);
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${dateLabel} 기준 새로운 알림`, emoji: true },
    },
    section('🔥 *오늘의 코딩 테스트*'),
    ...challenges.map((challenge) => section(challengeText(challenge))),
  ];

  if (jobs.length > 0) {
    blocks.push(
      { type: 'divider' },
      section(`💼 *신규 채용 알림 공고 · ${jobs.length}건*`),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '직전 일일 알림 이후 새롭게 등록된 마감일 확정 공고입니다.',
          },
        ],
      },
      ...packSectionText(jobs.map(jobText)).map(section),
    );
  }

  blocks.push({ type: 'divider' }, serviceLinks({ careergroundUrl: siteUrl, baeumzipUrl }));
  return {
    text: `${dateLabel} 기준 CareerGround 새 알림`,
    blocks,
  };
};

const buildJobsOnlyMessage = ({ siteUrl, jobs, snapshotCreatedAt }, { baeumzipUrl }) => {
  if (!snapshotCreatedAt) throw new Error('채용공고 재전송에는 스냅샷 반영 시각이 필요합니다.');
  if (jobs.length === 0) throw new Error('해당 스냅샷에서 재전송할 ACTIVE 채용공고가 없습니다.');
  const label = snapshotLabel(snapshotCreatedAt);
  return {
    text: `${label} final:latest CareerGround 채용 알림`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${label} final:latest 반영`, emoji: true },
      },
      section(`💼 *신규 채용 알림 공고 · ${jobs.length}건*`),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '해당 스냅샷에서 운영 DB에 새롭게 반영된 현재 ACTIVE 공고입니다.',
          },
        ],
      },
      ...packSectionText(jobs.map(jobText)).map(section),
      { type: 'divider' },
      serviceLinks({ careergroundUrl: siteUrl, baeumzipUrl }),
    ],
  };
};

const validateDigestPayload = (payload) => {
  if (!payload || !Array.isArray(payload.challenges) || !Array.isArray(payload.jobs)) {
    throw new Error('CareerGround 알림 응답 형식이 올바르지 않습니다.');
  }
  if (payload.challenges.length !== 4) {
    throw new Error(`Slack 코딩테스트는 4개여야 합니다: ${payload.challenges.length}개`);
  }
  const [level1, level2, advanced, sql] = payload.challenges;
  if (
    level1.track !== 'ALGORITHM' ||
    Number(level1.level) !== 1 ||
    level2.track !== 'ALGORITHM' ||
    Number(level2.level) !== 2 ||
    advanced.track !== 'ALGORITHM' ||
    Number(advanced.level) !== 3 ||
    advanced.isChallenge !== true ||
    sql.track !== 'SQL'
  ) {
    throw new Error('Slack 코딩테스트 순서는 Lv.1, Lv.2, 도전 Lv.3, SQL이어야 합니다.');
  }
};

export function formatSlackMessages(payload, { baeumzipUrl, jobsOnly = false }) {
  validateDigestPayload(payload);
  return [
    jobsOnly
      ? buildJobsOnlyMessage(payload, { baeumzipUrl })
      : buildDigestMessage(payload, { baeumzipUrl }),
  ];
}

const forceSendEnabled = (value) => ['1', 'true'].includes(String(value).toLowerCase());

export async function sendDailyDigest(
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
) {
  if (!forceSendEnabled(env.SLACK_DIGEST_FORCE_SEND)) {
    const decision = getKoreanDispatchDecision(now());
    if (!decision.shouldSend) return { messageCount: 0, skipped: decision };
  }

  const digestUrl = env.CAREERGROUND_DIGEST_URL;
  const digestToken = env.CAREERGROUND_DIGEST_TOKEN;
  const webhookUrl = env.SLACK_WEBHOOK_URL;
  const baeumzipUrl = env.BAEUMZIP_URL;
  if (!digestUrl || !digestToken || !webhookUrl || !baeumzipUrl) {
    throw new Error(
      'CAREERGROUND_DIGEST_URL, CAREERGROUND_DIGEST_TOKEN, SLACK_WEBHOOK_URL, BAEUMZIP_URL이 필요합니다.',
    );
  }
  const webhook = new URL(webhookUrl);
  if (webhook.protocol !== 'https:' || webhook.hostname !== 'hooks.slack.com') {
    throw new Error('Slack 공식 Incoming Webhook 주소가 필요합니다.');
  }

  const digestRequestUrl = new URL(digestUrl);
  const snapshotCreatedAt = String(env.SLACK_DIGEST_SNAPSHOT_CREATED_AT || '').trim();
  const jobsOnly = forceSendEnabled(env.SLACK_DIGEST_JOBS_ONLY);
  if (jobsOnly && !snapshotCreatedAt) {
    throw new Error('채용공고만 재전송하려면 SLACK_DIGEST_SNAPSHOT_CREATED_AT이 필요합니다.');
  }

  digestRequestUrl.pathname = `${digestRequestUrl.pathname.replace(/\/$/, '')}/claim`;
  digestRequestUrl.search = '';
  const apiHeaders = {
    authorization: `Bearer ${digestToken}`,
    'content-type': 'application/json',
  };
  const digestResponse = await fetchImpl(digestRequestUrl, {
    method: 'POST',
    headers: apiHeaders,
    body: JSON.stringify({ snapshotCreatedAt: snapshotCreatedAt || undefined, jobsOnly }),
    signal: globalThis.AbortSignal.timeout(15_000),
  });
  if (!digestResponse.ok) {
    throw new Error(`CareerGround 알림 API 오류: HTTP ${digestResponse.status}`);
  }
  const claim = await digestResponse.json();
  if (claim.status !== 'claimed') {
    return {
      messageCount: 0,
      skipped: {
        reason: claim.status === 'already-sent' ? 'already-sent' : 'delivery-blocked',
        dateKey: String(claim.deliveryKey || ''),
      },
    };
  }
  const settleUrl = new URL(digestRequestUrl);
  const settle = async (action, extra = {}) => {
    settleUrl.pathname = settleUrl.pathname.replace(/\/claim$/, `/${action}`);
    const response = await fetchImpl(settleUrl, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        deliveryKey: claim.deliveryKey,
        claimToken: claim.claimToken,
        ...extra,
      }),
      signal: globalThis.AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`CareerGround 발송 확정 API 오류: HTTP ${response.status}`);
  };
  const messages = formatSlackMessages(claim.payload, { baeumzipUrl, jobsOnly });
  for (const message of messages) {
    let slackResponse;
    try {
      slackResponse = await fetchImpl(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message),
        signal: globalThis.AbortSignal.timeout(15_000),
      });
    } catch (error) {
      await settle('fail', {
        uncertain: true,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    if (!slackResponse.ok) {
      await settle('fail', { error: `Slack HTTP ${slackResponse.status}` });
      throw new Error(`Slack 전송 오류: HTTP ${slackResponse.status}`);
    }
  }
  await settle('complete');
  return { messageCount: messages.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sendDailyDigest()
    .then(({ messageCount, skipped }) => {
      const result = skipped
        ? `Slack digest skipped: ${skipped.reason} (${skipped.dateKey})`
        : `Slack digest sent: ${messageCount}`;
      process.stdout.write(`${result}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
