import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { processAlert, receive } from './run.mjs';
import { sendDecision } from './send.mjs';

const SITE = 'https://careerground.example/';
const WEBHOOK = 'https://hooks.slack.com/services/T000/B000/secret';
const COLLECTED_AT = new Date('2026-10-01T09:05:00Z'); // Thu 18:05 KST
const MORNING = new Date('2026-10-01T22:50:00Z'); // Fri 07:50 KST
const LATE_MORNING = new Date('2026-10-01T23:40:00Z'); // Fri 08:40 KST

const job = (id, overrides = {}) => ({
  companyName: `회사${id}`,
  title: `${id}번 신입 백엔드 개발자`,
  sourceName: 'Saramin',
  sourceUrl: `https://www.saramin.co.kr/job-search/view?rec_idx=${id}`,
  deadlineAt: '2026-10-20',
  rolling: false,
  careerScope: '신입',
  ...overrides,
});

const catalogJob = {
  title: '이미 알린 공고',
  company: { name: '회사0' },
  sourceUrl: 'https://www.saramin.co.kr/job-search/view?rec_idx=0',
  deadlineAt: '2026-10-20T23:59:00+09:00',
};

let dir;
let requests;
let failures;

const fetchImpl = async (url, init = {}) => {
  const href = String(url);
  requests.push({ href, body: init.body });
  const fail = failures.find((failure) => href.includes(failure.match));
  if (fail?.throw) throw new Error('network down');
  if (fail) return new globalThis.Response('error', { status: fail.status });
  if (href.endsWith('/api/v1/jobs')) return globalThis.Response.json([catalogJob]);
  if (href.includes('/internal/slack-digest')) {
    return globalThis.Response.json({
      challenges: [
        {
          title: '과일 장수',
          track: 'ALGORITHM',
          level: 1,
          sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/135808',
        },
      ],
    });
  }
  if (href.startsWith('https://hooks.slack.com/')) return new globalThis.Response('ok');
  return new globalThis.Response('not found', { status: 404 });
};

const env = (overrides = {}) => ({
  JOB_ALERT_DATA_DIR: dir,
  CAREERGROUND_SITE_URL: SITE,
  CAREERGROUND_DIGEST_URL: `${SITE}api/v1/internal/slack-digest`,
  CAREERGROUND_DIGEST_TOKEN: 'digest-token',
  SLACK_WEBHOOK_URL: WEBHOOK,
  BAEUMZIP_URL: 'https://modumunje.com/',
  ...overrides,
});

const writeEvent = (title, jobs, author) => {
  const eventPath = join(dir, '..', `${title.replace(/\W+/gu, '-')}.json`);
  writeFileSync(
    eventPath,
    JSON.stringify({
      issue: {
        title,
        body: `\`\`\`json\n${JSON.stringify({ jobs })}\n\`\`\``,
        author_association: author,
      },
    }),
  );
  return eventPath;
};

const issueEnv = (title, jobs, { live = false, author = 'OWNER' } = {}) =>
  env({
    GITHUB_EVENT_NAME: 'issues',
    GITHUB_EVENT_PATH: writeEvent(title, jobs, author),
    JOB_ALERT_LIVE: live ? 'true' : '',
  });

// Mirrors the workflow: the receive job, then the process job.
const issue = async (title, jobs, { now, ...options } = {}) => {
  const eventEnv = issueEnv(title, jobs, options);
  const received = receive({ env: eventEnv, now });
  const processed = await processAlert({ env: eventEnv, fetchImpl, now });
  return { report: [...received.report, ...processed.report], result: processed.result };
};

const scheduled = (now, overrides = {}) =>
  processAlert({ env: env({ GITHUB_EVENT_NAME: 'schedule', ...overrides }), fetchImpl, now });

const ledger = () => JSON.parse(readFileSync(join(dir, 'ledger.json'), 'utf8'));
const slackPosts = () => requests.filter((request) => request.href.startsWith(WEBHOOK));

const collect = () =>
  issue('[JOB-ALERT][2026-10-01][collector-1]', [job(0), job(1), job(2), job(3)], {
    now: COLLECTED_AT,
  });

beforeEach(() => {
  dir = join(mkdtempSync(join(tmpdir(), 'job-alert-')), 'data');
  requests = [];
  failures = [];
});

afterEach(() => rmSync(join(dir, '..'), { recursive: true, force: true }));

describe('job alert submissions', () => {
  it('stores a collector list and excludes postings the old digest already announced', async () => {
    const { report } = await collect();

    const pending = JSON.parse(readFileSync(join(dir, 'pending.json'), 'utf8'));
    expect(pending.date).toBe('2026-10-01');
    expect(pending.jobs.map((item) => item.companyName)).toEqual(['회사1', '회사2', '회사3']);
    expect(report.join('\n')).toContain('수집기 1 (2026-10-01): 공고 4건 접수');
    expect(slackPosts()).toHaveLength(0);
  });

  it('keeps every submission when collectors arrive together', async () => {
    for (const slot of [1, 2, 3, 4, 5]) {
      const title = `[JOB-ALERT][2026-10-01][collector-${slot}]`;
      receive({ env: issueEnv(title, [job(slot * 10)]), now: COLLECTED_AT });
    }
    await scheduled(COLLECTED_AT);

    const pending = JSON.parse(readFileSync(join(dir, 'pending.json'), 'utf8'));
    expect(pending.collectorCount).toBe(5);
    expect(pending.jobs).toHaveLength(5);
  });

  it('ignores issues from untrusted authors', async () => {
    const { report } = await issue('[JOB-ALERT][2026-10-01][collector-1]', [job(1)], {
      now: COLLECTED_AT,
      author: 'NONE',
    });
    expect(report[0]).toContain('무시');
    expect(existsSync(join(dir, 'ledger.json'))).toBe(false);
  });

  it('refuses to start without a baseline of already announced postings', async () => {
    failures.push({ match: '/api/v1/jobs', status: 503 });
    await expect(collect()).rejects.toThrow('기준선');
  });
});

describe('job alert delivery', () => {
  it('sends once all three reviewers answered and records the sent jobs', async () => {
    await collect();
    const review = (slot, jobs) =>
      issue(`[JOB-ALERT][2026-10-02][reviewer-${slot}]`, jobs, { now: MORNING, live: true });

    expect((await review(1, [job(1), job(2)])).result.reason).toBe('waiting-for-reviews');
    expect((await review(2, [job(1)])).result.reason).toBe('waiting-for-reviews');
    const { result, report } = await review(3, [job(2), job(3)]);

    expect(result.status).toBe('sent');
    expect(report.at(-1)).toContain('공고 2건, 검증 3개(통과 기준 2)');
    const [post] = slackPosts();
    expect(post.body).toContain('회사1 — 1번 신입 백엔드 개발자');
    expect(post.body).toContain('회사2 — 2번 신입 백엔드 개발자');
    expect(post.body).not.toContain('회사3');
    expect(post.body).toContain('과일 장수');
    expect(ledger().deliveries['2026-10-02']).toMatchObject({
      mode: 'live',
      status: 'SENT',
      jobCount: 2,
      batches: ['2026-10-01'],
    });

    await scheduled(LATE_MORNING, { JOB_ALERT_LIVE: 'true' });
    expect(slackPosts()).toHaveLength(1);
  });

  it('sends with two reviews after 08:30 without waiting for the third', async () => {
    await collect();
    await issue('[JOB-ALERT][2026-10-02][reviewer-1]', [job(1)], { now: MORNING, live: true });
    const { result } = await issue('[JOB-ALERT][2026-10-02][reviewer-2]', [job(1)], {
      now: LATE_MORNING,
      live: true,
    });
    expect(result.status).toBe('sent');
    expect(result.final.jobs).toHaveLength(1);
  });

  it('holds evening reviews until the morning send signal', async () => {
    await collect();
    const evening = new Date('2026-10-01T11:30:00Z'); // Thu 20:30 KST
    for (const slot of [1, 2, 3]) {
      const title = `[JOB-ALERT][2026-10-01][reviewer-${slot}]`;
      const { result } = await issue(title, [job(1), job(2)], { now: evening, live: true });
      expect(result.reason).toBe('waiting-for-morning');
    }
    expect(slackPosts()).toHaveLength(0);

    const signal = new Date('2026-10-01T22:47:00Z'); // Fri 07:47 KST
    const { result } = await issue('[JOB-ALERT][2026-10-02][send]', [], {
      now: signal,
      live: true,
    });
    expect(result.status).toBe('sent');
    expect(result.final.jobs.map((item) => item.companyName)).toEqual(['회사1', '회사2']);
    expect(slackPosts()).toHaveLength(1);
  });

  it('previews without posting while the old digest is still live', async () => {
    await collect();
    for (const slot of [1, 2, 3]) {
      await issue(`[JOB-ALERT][2026-10-02][reviewer-${slot}]`, [job(1)], { now: MORNING });
    }
    expect(slackPosts()).toHaveLength(0);
    expect(ledger().deliveries['2026-10-02']).toMatchObject({ mode: 'dry-run', status: 'PREVIEW' });
    expect(ledger().sentJobs.some((item) => item.sentOn === '2026-10-02')).toBe(false);
  });

  it('announces held jobs and keeps the batch open when no reviewer answered', async () => {
    await collect();
    const { result } = await scheduled(LATE_MORNING, { JOB_ALERT_LIVE: 'true' });

    expect(result.status).toBe('sent');
    expect(slackPosts()[0].body).toContain('검증이 끝나지 않은 공고 3건');
    expect(ledger().deliveries['2026-10-02'].batches).toEqual([]);
    expect(JSON.parse(readFileSync(join(dir, 'pending.json'), 'utf8')).batches).toEqual([
      '2026-10-01',
    ]);
  });

  it('still sends jobs when every coding problem source fails', async () => {
    failures.push({ match: '/internal/slack-digest', status: 500 });
    await collect();
    for (const slot of [1, 2, 3]) {
      await issue(`[JOB-ALERT][2026-10-02][reviewer-${slot}]`, [job(1)], {
        now: MORNING,
        live: true,
      });
    }
    const [post] = slackPosts();
    expect(post.body).toContain('회사1');
    expect(post.body).not.toContain('오늘의 코딩 테스트');
  });

  it('allows a retry after a Slack error but not after an uncertain send', async () => {
    await collect();
    failures.push({ match: 'hooks.slack.com', status: 500 });
    await expect(scheduled(LATE_MORNING, { JOB_ALERT_LIVE: 'true' })).rejects.toThrow('HTTP 500');
    expect(ledger().deliveries['2026-10-02']).toBeUndefined();

    failures = [{ match: 'hooks.slack.com', throw: true }];
    await expect(scheduled(LATE_MORNING, { JOB_ALERT_LIVE: 'true' })).rejects.toThrow('network');
    expect(ledger().deliveries['2026-10-02'].status).toBe('UNCERTAIN');

    failures = [];
    const { result } = await scheduled(LATE_MORNING, { JOB_ALERT_LIVE: 'true' });
    expect(result.reason).toBe('already-sent');
  });
});

describe('job alert send decision', () => {
  const emptyLedger = { deliveries: {} };

  it('skips weekends and Korean public holidays unless forced', () => {
    const saturday = new Date('2026-10-02T23:50:00Z');
    const hangulDay = new Date('2026-10-08T23:50:00Z');
    expect(sendDecision({ trigger: 'schedule', now: saturday, ledger: emptyLedger }).reason).toBe(
      'weekend',
    );
    expect(sendDecision({ trigger: 'schedule', now: hangulDay, ledger: emptyLedger }).reason).toBe(
      'public-holiday',
    );
    expect(
      sendDecision({ trigger: 'manual', now: hangulDay, ledger: emptyLedger, force: true }).send,
    ).toBe(true);
  });

  it('keeps sending on weekdays when the holiday table has no entry for the year', () => {
    const decision = sendDecision({
      trigger: 'schedule',
      now: new Date('2027-01-04T23:50:00Z'),
      ledger: emptyLedger,
    });
    expect(decision.send).toBe(true);
  });

  it('never sends before 07:00 KST', () => {
    const early = new Date('2026-10-01T21:30:00Z'); // Fri 06:30 KST
    expect(
      sendDecision({ trigger: 'review', now: early, ledger: emptyLedger, reviewCount: 3 }).reason,
    ).toBe('too-early');
  });

  it('lets a live send replace a same-day preview', () => {
    const ledgerWithPreview = { deliveries: { '2026-10-02': { mode: 'dry-run' } } };
    expect(
      sendDecision({ trigger: 'schedule', now: MORNING, ledger: ledgerWithPreview, live: true })
        .send,
    ).toBe(true);
    expect(
      sendDecision({ trigger: 'schedule', now: MORNING, ledger: ledgerWithPreview, live: false })
        .reason,
    ).toBe('already-sent');
  });
});
