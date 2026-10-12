import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { batchReadiness } from '../job-alert/dispatch.mjs';
import { kstDateKey, kstMinutes } from '../job-alert/job-list.mjs';
import { sendJobAlert } from '../job-alert/send.mjs';
import { loadLedger, openBatchDates, readJson, writeJson } from '../job-alert/store.mjs';
import { getKoreanDispatchDecision } from '../slack/korean-business-day.mjs';

export const DATE = '2026-10-13';
export const CODE_SHA = 'e12813fe4f8fa2deb7a6093fdef4170293ec3231';
export const APPROVAL = 'Sentinel_211400bd80f081918607f3c28f663c0a';
const TEST_RUN = '38274617623';
const ALLOWED_CHANGES = new Set([
  '.github/workflows/job-alert.yml',
  'scripts/operations/job-alert-exception-20261013.mjs',
  'scripts/operations/job-alert-exception-20261013.test.mjs',
]);

export function validateException({ env, now, ledger, readiness, release, test, changedPaths }) {
  const fail = (message) => { throw new Error(message); };
  if (kstDateKey(now) !== DATE || env.JOB_ALERT_BATCH_DATE !== DATE) fail('Exception is limited to 2026-10-13 and its unchanged batch.');
  if (env.JOB_ALERT_EXCEPTION_APPROVAL !== APPROVAL) fail('The explicit one-time user approval is required.');
  if (kstMinutes(now) < 480) fail('Production cannot send before 08:00 KST.');
  if (!getKoreanDispatchDecision(now).shouldSend) fail('Korean business-day gate rejected this send.');
  if (env.JOB_ALERT_LIVE !== 'true' || env.JOB_ALERT_DRY_RUN !== 'false' || env.JOB_ALERT_FORCE !== 'false') fail('Live production and force=false are required.');
  if (env.JOB_ALERT_PRODUCTION_START_DATE !== '2026-10-02') fail('Unexpected production start setting.');
  if (!ledger || ledger.deliveries[DATE]?.mode === 'live') fail('Existing live delivery, including uncertain delivery, prevents a resend.');
  if (!readiness.ready || readiness.date !== DATE || readiness.collectorCount !== 5 || readiness.reviewCount !== 3) fail('All five collectors and three reviewers are required.');
  if (!test || test.status !== 'SENT' || test.mode !== 'live' || test.batchDate !== DATE || test.codeSha !== CODE_SHA || test.runId !== TEST_RUN || test.reviewCount !== 3 || test.heldCount !== 0 || test.fingerprint !== readiness.fingerprint) fail('The verified actual test must match this unchanged batch and core code.');
  if (!release || release.status !== 'READY' || release.batchDate !== DATE || release.codeSha !== CODE_SHA || release.fingerprint !== readiness.fingerprint || release.testRunId !== TEST_RUN) fail('A matching normal READY release is required.');
  if (!Array.isArray(changedPaths) || changedPaths.some(path => !ALLOWED_CHANGES.has(path))) fail('Only the dated exception wrapper, its tests and workflow may differ from the tested code.');
}

async function main() {
  const env = process.env;
  const now = new Date();
  const dataDir = env.JOB_ALERT_DATA_DIR;
  const testDir = env.JOB_ALERT_TEST_DATA_DIR;
  const ledger = loadLedger(dataDir);
  const readiness = batchReadiness(dataDir, DATE);
  const release = readJson(join(testDir, 'releases', `${DATE}.json`));
  const test = readJson(join(testDir, 'results', `${DATE}.json`));
  const changedPaths = execFileSync('git', ['diff', '--name-only', CODE_SHA, 'HEAD'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  validateException({ env, now, ledger, readiness, release, test, changedPaths });
  if (!openBatchDates(dataDir, ledger, now).includes(DATE)) throw new Error('This batch is already closed.');
  const receipt = {
    schema: 'careerground-one-time-production-exception/v1',
    exceptionDateKst: DATE,
    batchDate: DATE,
    expiresAt: '2026-10-13T23:59:59+09:00',
    exception: 'same-day-batch-only',
    approvedUserMessageId: APPROVAL,
    productionChannelId: 'C0BR9TNS4BD',
    coreCodeSha: CODE_SHA,
    workflowCodeSha: env.GITHUB_SHA,
    runId: env.GITHUB_RUN_ID,
    testRunId: test.runId,
    fingerprint: readiness.fingerprint,
    releaseApprovedAt: release.approvedAt,
    force: false,
    defaultNextDayPolicyChanged: false,
  };
  const path = join(dataDir, 'exceptions', `${DATE}.json`);
  writeJson(path, { ...receipt, status: 'AUTHORIZED', checkedAt: now.toISOString() });
  try {
    const result = await sendJobAlert({ dataDir, ledger, env, trigger: 'manual', live: true, force: false, now, batchDate: DATE, allowEmpty: true });
    const delivery = ledger.deliveries[DATE];
    writeJson(path, { ...receipt, status: delivery?.status ?? result.status, deliveryAt: delivery?.at ?? null, jobCount: delivery?.jobCount ?? null, reviewCount: delivery?.reviewCount ?? null, heldCount: delivery?.heldCount ?? null });
    console.log(JSON.stringify({ status: result.status, batchDate: DATE, jobCount: delivery?.jobCount ?? null, reviewCount: delivery?.reviewCount ?? null, heldCount: delivery?.heldCount ?? null, approvedUserMessageId: APPROVAL, exceptionDateKst: DATE }));
  } catch (error) {
    const delivery = ledger.deliveries[DATE];
    writeJson(path, { ...receipt, status: delivery?.status ?? 'FAILED', deliveryAt: delivery?.at ?? null, jobCount: delivery?.jobCount ?? null });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(String(error.message).replace(/https:\/\/hooks\.slack\.com\/[^\s]+/gu, '[redacted webhook]'));
    process.exitCode = 1;
  });
}
