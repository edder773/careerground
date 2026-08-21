import process from 'node:process';
import { URL, pathToFileURL } from 'node:url';

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

const challengeText = (challenge) => {
  const track = challenge.track === 'SQL' ? 'SQL' : '알고리즘';
  return [
    `• *${slackUrl(challenge.sourceUrl, challenge.title)}*`,
    `  ${track} · Lv.${Number(challenge.level)}`,
  ].join('\n');
};

const jobText = (job) =>
  [
    `• *${slackUrl(job.sourceUrl, `${job.company} — ${job.title}`)}*`,
    `  마감 ${deadlineLabel(job.deadlineAt)} · ${escapeSlackText(job.sourceName)}`,
  ].join('\n');

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

const footer = (siteUrl, label) => ({
  type: 'context',
  elements: [{ type: 'mrkdwn', text: slackUrl(siteUrl, label) }],
});

const buildChallengeMessage = ({ challenges, siteUrl }) => ({
  text: '오늘의 코딩 테스트',
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔥 오늘의 코딩 테스트', emoji: true },
    },
    { type: 'divider' },
    ...challenges.map((challenge) => section(challengeText(challenge))),
    footer(siteUrl, 'CareerGround에서 자세히 보기'),
  ],
});

const buildJobsMessage = ({ jobs, siteUrl }) => ({
  text: `신규 채용 알림 ${jobs.length}건`,
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: '💼 신규 채용 알림', emoji: true },
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `새롭게 등록된 마감일 확정 공고 *${jobs.length}개*입니다.` },
      ],
    },
    { type: 'divider' },
    ...packSectionText(jobs.map(jobText)).map(section),
    footer(siteUrl, 'CareerGround에서 전체 공고 보기'),
  ],
});

const validateDigestPayload = (payload) => {
  if (!payload || !Array.isArray(payload.challenges) || !Array.isArray(payload.jobs)) {
    throw new Error('CareerGround 알림 응답 형식이 올바르지 않습니다.');
  }
  if (payload.challenges.length !== 3) {
    throw new Error(`오늘의 코딩테스트는 3개여야 합니다: ${payload.challenges.length}개`);
  }
};

export function formatSlackMessages(payload) {
  validateDigestPayload(payload);
  return [
    buildChallengeMessage(payload),
    ...(payload.jobs.length > 0 ? [buildJobsMessage(payload)] : []),
  ];
}

export async function sendDailyDigest(env = process.env, fetchImpl = globalThis.fetch) {
  const digestUrl = env.CAREERGROUND_DIGEST_URL;
  const digestToken = env.CAREERGROUND_DIGEST_TOKEN;
  const webhookUrl = env.SLACK_WEBHOOK_URL;
  if (!digestUrl || !digestToken || !webhookUrl) {
    throw new Error(
      'CAREERGROUND_DIGEST_URL, CAREERGROUND_DIGEST_TOKEN, SLACK_WEBHOOK_URL이 필요합니다.',
    );
  }
  const webhook = new URL(webhookUrl);
  if (webhook.protocol !== 'https:' || webhook.hostname !== 'hooks.slack.com') {
    throw new Error('Slack 공식 Incoming Webhook 주소가 필요합니다.');
  }

  const digestResponse = await fetchImpl(digestUrl, {
    headers: { authorization: `Bearer ${digestToken}` },
    signal: globalThis.AbortSignal.timeout(15_000),
  });
  if (!digestResponse.ok) {
    throw new Error(`CareerGround 알림 API 오류: HTTP ${digestResponse.status}`);
  }
  const messages = formatSlackMessages(await digestResponse.json());
  for (const message of messages) {
    const slackResponse = await fetchImpl(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
      signal: globalThis.AbortSignal.timeout(15_000),
    });
    if (!slackResponse.ok) throw new Error(`Slack 전송 오류: HTTP ${slackResponse.status}`);
  }
  return { messageCount: messages.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sendDailyDigest()
    .then(({ messageCount }) => process.stdout.write(`Slack digest sent: ${messageCount}\n`))
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
