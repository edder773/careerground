import { URL } from 'node:url';

const MAX_SECTION_LENGTH = 2_800;

const escapeSlackText = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const slackUrl = (value, label) => {
  const url = new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP(S) 링크만 허용됩니다.');
  const safeLabel = escapeSlackText(label).replaceAll('|', '｜');
  return `<${url.toString().replaceAll('|', '%7C').replaceAll('>', '%3E')}|${safeLabel}>`;
};

const kstLabel = (value, options) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(new Date(value));

const challengeText = (challenge) => {
  const track = challenge.track === 'SQL' ? 'SQL' : '알고리즘';
  const title = challenge.isChallenge ? `(도전 문제) ${challenge.title}` : challenge.title;
  return [
    `• *${slackUrl(challenge.sourceUrl, title)}*`,
    `  ${track} · Lv.${Number(challenge.level)}`,
  ].join('\n');
};

const jobText = (job) =>
  [
    `• *${slackUrl(job.sourceUrl, `${job.companyName} — ${job.title}`)}*`,
    ...(job.itRole ? [`  IT 분야: ${escapeSlackText(job.itRole)}`] : []),
    `  마감 ${kstLabel(job.deadlineAt, { month: 'long', day: 'numeric' })} · ${escapeSlackText(job.sourceName)}`,
  ].join('\n');

const packSectionText = (entries) => {
  const sections = [];
  let current = '';
  for (const entry of entries) {
    const candidate = current ? `${current}\n\n${entry}` : entry;
    if (current && candidate.length > MAX_SECTION_LENGTH) {
      sections.push(current);
      current = entry;
    } else {
      current = candidate;
    }
  }
  if (current) sections.push(current);
  return sections;
};

const section = (text) => ({ type: 'section', text: { type: 'mrkdwn', text } });
const context = (text) => ({ type: 'context', elements: [{ type: 'mrkdwn', text }] });

export function buildAlertMessage({ date, jobs, challenges, heldCount, siteUrl, baeumzipUrl }) {
  const dateLabel = kstLabel(`${date}T12:00:00+09:00`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${dateLabel} 기준 새로운 알림`, emoji: true },
    },
  ];
  if (challenges.length > 0) {
    blocks.push(
      section('🔥 *오늘의 코딩 테스트*'),
      ...challenges.map((c) => section(challengeText(c))),
    );
  }
  if (jobs.length > 0 || heldCount > 0) {
    if (blocks.length > 1) blocks.push({ type: 'divider' });
    blocks.push(section(`💼 *신규 채용 알림 공고 · ${jobs.length}건*`));
    if (jobs.length > 0) {
      blocks.push(
        context('직전 알림 이후 새로 확인된 마감일 확정 공고입니다.'),
        ...packSectionText(jobs.map(jobText)).map(section),
      );
    }
    if (heldCount > 0) {
      blocks.push(
        context(`검증이 끝나지 않은 공고 ${heldCount}건은 다음 알림에서 다시 확인합니다.`),
      );
    }
  }
  blocks.push(
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*CareerGround*\n${slackUrl(siteUrl, '코딩테스트·채용공고 전체 보기 →')}`,
        },
        {
          type: 'mrkdwn',
          text: `*모두의 문제집*\n${slackUrl(baeumzipUrl, '자격증 & SW 전공 테스트 준비 →')}`,
        },
      ],
    },
  );
  return { text: `${dateLabel} 기준 CareerGround 새 알림`, blocks };
}
