import process from 'node:process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { kstDateKey, kstMinutes } from './job-list.mjs';
import { sendJobAlert } from './send.mjs';
import { loadLedger, loadSubmissions, openBatchDates, readJson, writeJson } from './store.mjs';

const enabled = (value) => ['1', 'true'].includes(String(value ?? '').toLowerCase());
const dateKey = (value) =>
  /^\d{4}-\d{2}-\d{2}$/u.test(String(value)) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function batchReadiness(dataDir, date) {
  if (!dateKey(date)) throw new Error('유효한 배치 날짜가 필요합니다.');
  const collectors = loadSubmissions(dataDir, date, 'collector');
  const reviewers = loadSubmissions(dataDir, date, 'reviewer');
  const complete = (items, kind, count) =>
    items.length === count &&
    Array.from({ length: count }, (_, i) => i + 1).every((slot) =>
      items.some(
        (item) =>
          item.slot === slot &&
          item.kind === kind &&
          item.date === date &&
          Array.isArray(item.jobs),
      ),
    );
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify(
        [...collectors, ...reviewers].map(({ kind, slot, date, jobs }) => ({
          kind,
          slot,
          date,
          jobs,
        })),
      ),
    )
    .digest('hex');
  return {
    date,
    fingerprint,
    collectorCount: collectors.length,
    reviewCount: reviewers.length,
    ready: complete(collectors, 'collector', 5) && complete(reviewers, 'reviewer', 3),
  };
}
const skip = (reason) => ({ status: 'skipped', reason });
export async function dispatchAlert({
  env = process.env,
  now = new Date(),
  fetchImpl = globalThis.fetch,
} = {}) {
  const destination = env.JOB_ALERT_DESTINATION || 'production';
  if (!['test', 'production'].includes(destination)) throw new Error('알 수 없는 발송 대상입니다.');
  const today = kstDateKey(now);
  const live = !enabled(env.JOB_ALERT_DRY_RUN);
  if (destination === 'production') {
    if (!enabled(env.JOB_ALERT_LIVE)) return skip('production-disabled');
    if (env.JOB_ALERT_PRODUCTION_START_DATE && today < env.JOB_ALERT_PRODUCTION_START_DATE)
      return skip('before-production-start');
    if (kstMinutes(now) < 8 * 60) return skip('before-08:00');
  }
  const sourceDir = env.JOB_ALERT_DATA_DIR;
  const sourceLedger = loadLedger(sourceDir);
  if (!sourceLedger) throw new Error('운영 공고 기준선 원장이 없습니다.');
  const dates = openBatchDates(sourceDir, sourceLedger, now);
  const batchDate =
    env.JOB_ALERT_BATCH_DATE ||
    (destination === 'test'
      ? today
      : dates.filter((date) => date < today && batchReadiness(sourceDir, date).ready).at(-1));
  if (!batchDate) return skip('no-reviewed-prior-batch');
  if (
    !dateKey(batchDate) ||
    batchDate > today ||
    (destination === 'production' && batchDate >= today)
  )
    throw new Error('운영 발송은 이전 날짜에 수집·검증한 배치만 사용합니다.');
  const readiness = batchReadiness(sourceDir, batchDate);
  if (!readiness.ready)
    throw new Error(
      `배치 미완료: ${batchDate}, 수집 ${readiness.collectorCount}/5, 검증 ${readiness.reviewCount}/3`,
    );
  if (destination === 'production') {
    const release = readJson(join(env.JOB_ALERT_TEST_DATA_DIR, 'releases', `${batchDate}.json`));
    if (
      !release ||
      release.status !== 'READY' ||
      release.batchDate !== batchDate ||
      !env.GITHUB_SHA ||
      release.codeSha !== env.GITHUB_SHA ||
      release.fingerprint !== readiness.fingerprint
    )
      throw new Error('해당 배치와 코드의 테스트·확인 승인 기록이 없습니다.');
    if (sourceLedger.deliveries[today]?.mode === 'live') return skip('already-sent');
    if (!dates.includes(batchDate)) return skip('batch-closed');
    const result = await sendJobAlert({
      dataDir: sourceDir,
      ledger: sourceLedger,
      env,
      trigger: 'manual',
      live,
      force: enabled(env.JOB_ALERT_FORCE),
      fetchImpl,
      now,
      batchDate,
      allowEmpty: true,
    });
    return { destination, batchDate, readiness, ...result };
  }
  const testDir = env.JOB_ALERT_TEST_DATA_DIR;
  if (!testDir || resolve(testDir) === resolve(sourceDir))
    throw new Error('테스트 원장을 운영 원장과 분리해야 합니다.');
  const testLedger = readJson(join(testDir, 'ledger.json'), { deliveries: {} });
  const isolated = mkdtempSync(join(tmpdir(), 'job-alert-test-'));
  try {
    cpSync(join(sourceDir, 'batches', batchDate), join(isolated, 'batches', batchDate), {
      recursive: true,
    });
    const ledger = {
      sentJobs: globalThis.structuredClone(sourceLedger.sentJobs),
      deliveries: globalThis.structuredClone(testLedger.deliveries),
    };
    if (enabled(env.JOB_ALERT_RETEST)) {
      if (ledger.deliveries[today]?.status === 'UNCERTAIN')
        throw new Error('수신 여부가 불확실한 테스트는 Slack 확인 후 수동 복구가 필요합니다.');
      delete ledger.deliveries[today];
    }
    const prior = JSON.stringify(ledger.deliveries[today]);
    const webhook = String(env.SLACK_TEST_WEBHOOK_URL || '');
    if (live && !webhook) throw new Error('테스트 채널 전용 SLACK_TEST_WEBHOOK_URL이 필요합니다.');
    const testFetch = async (url, init = {}) => {
      if (init.method !== 'POST') return fetchImpl(url, init);
      if (String(url) !== webhook) throw new Error('테스트 발송 주소 불일치');
      const message = JSON.parse(init.body);
      message.text = '[테스트] ' + message.text;
      message.blocks[0].text.text = '[테스트] ' + message.blocks[0].text.text;
      message.blocks.splice(1, 0, {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `테스트 채널 전용 · 수집 배치 ${batchDate} · 운영 발송 기록에 반영하지 않습니다.`,
          },
        ],
      });
      return fetchImpl(url, { ...init, body: JSON.stringify(message) });
    };
    let result;
    try {
      result = await sendJobAlert({
        dataDir: isolated,
        ledger,
        env: { ...env, SLACK_WEBHOOK_URL: webhook },
        trigger: 'manual',
        live,
        force: enabled(env.JOB_ALERT_FORCE),
        fetchImpl: testFetch,
        now,
        batchDate,
        allowEmpty: true,
      });
      return { destination, batchDate, readiness, ...result };
    } finally {
      const delivery = ledger.deliveries[today];
      if (delivery && JSON.stringify(delivery) !== prior) {
        const record = {
          ...delivery,
          destination: 'test',
          batchDate,
          fingerprint: readiness.fingerprint,
          codeSha: env.GITHUB_SHA || null,
          runId: env.GITHUB_RUN_ID || null,
        };
        testLedger.deliveries[today] = record;
        writeJson(join(testDir, 'ledger.json'), testLedger);
        writeJson(join(testDir, 'results', `${batchDate}.json`), record);
      }
    }
  } finally {
    rmSync(isolated, { recursive: true, force: true });
  }
}
export function approveTest({ env = process.env, now = new Date() } = {}) {
  const batchDate = env.JOB_ALERT_BATCH_DATE || kstDateKey(now);
  if (!dateKey(batchDate)) throw new Error('승인할 배치 날짜가 필요합니다.');
  const readiness = batchReadiness(env.JOB_ALERT_DATA_DIR, batchDate);
  const result = readJson(join(env.JOB_ALERT_TEST_DATA_DIR, 'results', `${batchDate}.json`));
  if (
    !result ||
    result.mode !== 'live' ||
    result.status !== 'SENT' ||
    result.reviewCount !== 3 ||
    result.heldCount !== 0 ||
    result.batchDate !== batchDate ||
    !env.GITHUB_SHA ||
    result.codeSha !== env.GITHUB_SHA ||
    !readiness.ready ||
    result.fingerprint !== readiness.fingerprint
  )
    throw new Error('이 코드와 배치의 정상 테스트 발송 기록이 없습니다.');
  const release = {
    status: 'READY',
    batchDate,
    fingerprint: readiness.fingerprint,
    codeSha: env.GITHUB_SHA,
    testRunId: result.runId,
    jobCount: result.jobCount,
    reviewCount: result.reviewCount,
    approvedAt: now.toISOString(),
  };
  writeJson(join(env.JOB_ALERT_TEST_DATA_DIR, 'releases', `${batchDate}.json`), release);
  return release;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = process.env.JOB_ALERT_APPROVE === 'true' ? approveTest() : await dispatchAlert();
    const summary = {
      status: result.status,
      reason: result.reason ?? null,
      destination: result.destination ?? null,
      batchDate: result.batchDate ?? null,
      jobCount: result.final?.jobs.length ?? result.jobCount ?? null,
      reviewCount: result.final?.reviewCount ?? result.reviewCount ?? null,
      heldCount: result.final?.heldCount ?? null,
    };
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const { appendFileSync } = await import('node:fs');
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Job alert\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알리미 처리 실패';
    process.stderr.write(
      `${message.replace(/https:\/\/hooks\.slack\.com\/[^\s]+/gu, '[redacted webhook]')}\n`,
    );
    process.exitCode = 1;
  }
}
