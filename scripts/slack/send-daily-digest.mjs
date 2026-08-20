import process from 'node:process';
import { URL, pathToFileURL } from 'node:url';

const MAX_MESSAGE_LENGTH = 3_800;

const escapeSlackText = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const slackUrl = (value, label) => {
  const url = new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP(S) 링크만 허용됩니다.');
  return `<${url.toString().replaceAll('|', '%7C').replaceAll('>', '%3E')}|${label}>`;
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

const challengeLine = (challenge, index) => {
  const track = challenge.track === 'SQL' ? 'SQL' : '알고리즘';
  return `${index + 1}. *${escapeSlackText(challenge.title)}* · ${track} Lv.${Number(challenge.level)} · ${slackUrl(challenge.sourceUrl, '문제 열기')}`;
};

const jobLines = (job, index) => [
  `${index + 1}. *${escapeSlackText(job.company)} — ${escapeSlackText(job.title)}*`,
  `   마감 ${deadlineLabel(job.deadlineAt)} · ${escapeSlackText(job.sourceName)} · ${slackUrl(job.sourceUrl, '원문 보기')}`,
];

export function formatSlackMessages(payload) {
  if (!payload || !Array.isArray(payload.challenges) || !Array.isArray(payload.jobs)) {
    throw new Error('CareerGround 알림 응답 형식이 올바르지 않습니다.');
  }
  if (payload.challenges.length !== 3) {
    throw new Error(`오늘의 코딩테스트는 3개여야 합니다: ${payload.challenges.length}개`);
  }

  const intro = [
    '*CareerGround 오늘의 업데이트*',
    '',
    `모든 상세 항목은 ${slackUrl(payload.siteUrl, 'CareerGround')}에서 확인할 수 있습니다.`,
    '',
    '*오늘의 코딩 테스트*',
    '',
    ...payload.challenges.map(challengeLine),
  ];
  if (payload.jobs.length === 0) return [intro.join('\n')];

  const messages = [];
  let current = [...intro, '', '*신규 채용 알림 공고*', ''];
  payload.jobs.forEach((job, index) => {
    const lines = jobLines(job, index);
    const candidate = [...current, ...lines].join('\n');
    if (candidate.length > MAX_MESSAGE_LENGTH && current.length > 2) {
      messages.push(current.join('\n'));
      current = ['*신규 채용 알림 공고 (계속)*', '', ...lines];
    } else {
      current.push(...lines);
    }
  });
  messages.push(current.join('\n'));
  return messages;
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
  for (const text of messages) {
    const slackResponse = await fetchImpl(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
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
