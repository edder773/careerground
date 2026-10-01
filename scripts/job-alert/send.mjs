import { URL } from 'node:url';
import { isVerifiedCodingProblem } from '../../shared/verified-coding-problem.mjs';
import { getKoreanDispatchDecision } from '../slack/korean-business-day.mjs';
import { kstDateKey, kstMinutes } from './job-list.mjs';
import { buildFinal } from './pipeline.mjs';
import { ledgerEntry, loadSubmissions, rebuildPending, saveLedger } from './store.mjs';
import { buildAlertMessage } from './slack-message.mjs';

export const REVIEW_SEND_EARLIEST = 7 * 60; // 07:00 KST
export const PARTIAL_REVIEW_SEND_AFTER = 8 * 60 + 30; // 08:30 KST
export const SUBMISSION_SEND_LATEST = 12 * 60; // 12:00 KST
const REQUEST_TIMEOUT_MS = 15_000;

// One alert per Korean business day. Reviewers run in the evening and the
// 07:45 [send] issue delivers the morning alert. A submission that arrives in
// the morning also sends once all three reviewers are in (two after 08:30);
// one that arrives later waits for the next morning instead of alerting at
// night. Scheduled and manual triggers send with whatever has arrived.
export function sendDecision({ trigger, now, ledger, reviewCount, live, force = false }) {
  const today = kstDateKey(now);
  const delivery = ledger.deliveries[today];
  if (delivery && (delivery.mode === 'live' || !live)) {
    return { send: false, reason: 'already-sent', today };
  }
  if (!force) {
    const businessDay = getKoreanDispatchDecision(now);
    // A missing holiday table must not silence every weekday alert of a new year.
    if (!businessDay.shouldSend && businessDay.reason !== 'holiday-calendar-unavailable') {
      return { send: false, reason: businessDay.reason, today };
    }
    const minutes = kstMinutes(now);
    if (minutes < REVIEW_SEND_EARLIEST) return { send: false, reason: 'too-early', today };
    if (trigger === 'submission' && minutes >= SUBMISSION_SEND_LATEST) {
      return { send: false, reason: 'waiting-for-morning', today };
    }
    if (
      trigger === 'submission' &&
      reviewCount < 3 &&
      !(reviewCount >= 2 && minutes >= PARTIAL_REVIEW_SEND_AFTER)
    ) {
      return { send: false, reason: 'waiting-for-reviews', today };
    }
  }
  return { send: true, today };
}

const getJson = async (fetchImpl, url, headers = {}) => {
  const response = await fetchImpl(url, {
    headers,
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// Coding problems are optional decoration. Any failure drops the section and
// the job alert still goes out.
export async function loadChallenges(env, fetchImpl) {
  const attempts = [
    async () => {
      if (!env.CAREERGROUND_DIGEST_URL || !env.CAREERGROUND_DIGEST_TOKEN) return [];
      const preview = await getJson(fetchImpl, new URL(env.CAREERGROUND_DIGEST_URL), {
        authorization: `Bearer ${env.CAREERGROUND_DIGEST_TOKEN}`,
      });
      return preview.challenges ?? [];
    },
    async () => {
      const daily = await getJson(
        fetchImpl,
        new URL('/api/v1/coding/daily-challenges', env.CAREERGROUND_SITE_URL),
      );
      return daily.map(({ problem }) => ({
        title: problem.displayTitle,
        track: problem.track,
        level: problem.level,
        sourceUrl: problem.sourceUrl,
      }));
    },
  ];
  for (const attempt of attempts) {
    try {
      const challenges = (await attempt()).filter((challenge) =>
        isVerifiedCodingProblem(challenge),
      );
      if (challenges.length > 0) return challenges;
    } catch {
      // Fall through to the next source.
    }
  }
  return [];
}

export async function sendJobAlert({
  dataDir,
  ledger,
  env,
  trigger,
  live,
  force = false,
  fetchImpl = globalThis.fetch,
  now = new Date(),
  batchDate,
}) {
  // A live send replaces today's preview, so the batches the preview closed
  // are open again. Otherwise the live alert would go out empty.
  const today = kstDateKey(now);
  if (live && ledger.deliveries[today]?.mode === 'dry-run') delete ledger.deliveries[today];
  const pending = rebuildPending(dataDir, ledger, now, batchDate);
  const reviews = pending.date ? loadSubmissions(dataDir, pending.date, 'reviewer') : [];
  const decision = sendDecision({
    trigger,
    now,
    ledger,
    reviewCount: reviews.length,
    live,
    force,
  });
  if (!decision.send) return { status: 'skipped', reason: decision.reason, pending };

  const final = buildFinal({ pending, reviews, now });
  const challenges = await loadChallenges(env, fetchImpl);
  if (final.jobs.length === 0 && final.heldCount === 0 && challenges.length === 0) {
    return { status: 'skipped', reason: 'nothing-to-send', pending, final };
  }
  const message = buildAlertMessage({
    date: decision.today,
    jobs: final.jobs,
    challenges,
    heldCount: final.heldCount,
    siteUrl: env.CAREERGROUND_SITE_URL,
    baeumzipUrl: env.BAEUMZIP_URL,
  });
  // Batches with no review stay open and are reviewed again the next morning.
  const delivery = {
    mode: live ? 'live' : 'dry-run',
    trigger,
    at: now.toISOString(),
    jobCount: final.jobs.length,
    heldCount: final.heldCount,
    reviewCount: final.reviewCount,
    batches: final.reviewCount > 0 ? pending.batches : [],
  };
  const record = (status) => {
    ledger.deliveries[decision.today] = { ...delivery, status };
    if (status === 'SENT') {
      ledger.sentJobs.push(...final.jobs.map((job) => ledgerEntry(job, decision.today)));
    }
    saveLedger(dataDir, ledger, now);
  };

  if (!live) {
    record('PREVIEW');
    return { status: 'dry-run', pending, final, message };
  }

  const webhook = new URL(String(env.SLACK_WEBHOOK_URL || ''));
  if (webhook.protocol !== 'https:' || webhook.hostname !== 'hooks.slack.com') {
    throw new Error('Slack 공식 Incoming Webhook 주소가 필요합니다.');
  }
  let response;
  try {
    response = await fetchImpl(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
      signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Slack may have received it. Block automatic retries for today rather
    // than risk a duplicate; a person can clear the entry to resend.
    record('UNCERTAIN');
    throw error;
  }
  if (!response.ok) throw new Error(`Slack 전송 오류: HTTP ${response.status}`);
  record('SENT');
  return { status: 'sent', pending, final, message };
}
