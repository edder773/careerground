import { appendFileSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { URL, pathToFileURL } from 'node:url';
import { parseJobList, parseSubmissionTitle, kstDateKey } from './job-list.mjs';
import { sendJobAlert } from './send.mjs';
import {
  loadLedger,
  mergeCatalogBaseline,
  openBatchDates,
  saveLedger,
  saveSubmission,
  rebuildPending,
} from './store.mjs';

const TRUSTED_AUTHORS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const KIND_LABEL = { collector: '수집기', reviewer: '검증기' };
const EMPTY_LEDGER = () => ({ sentJobs: [], deliveries: {} });

const enabled = (value) => ['1', 'true'].includes(String(value ?? '').toLowerCase());

const readEvent = (env) =>
  env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')) : {};

const trustedSubmission = (event) => {
  const parsed = parseSubmissionTitle(event.issue?.title);
  return parsed && TRUSTED_AUTHORS.has(event.issue?.author_association) ? parsed : null;
};

const IGNORED = { report: ['무시: JOB-ALERT 제출 형식이 아니거나 신뢰된 작성자가 아닙니다.'] };

// Step 1 of an issue event. It writes only the submission's own file, so
// concurrent submissions never conflict and none is ever dropped.
export function receive({ env = process.env, now = new Date() } = {}) {
  const dataDir = env.JOB_ALERT_DATA_DIR;
  const event = readEvent(env);
  const parsed = trustedSubmission(event);
  if (!parsed) return IGNORED;
  if (parsed.kind === 'send') return { report: ['발송 요청을 접수했습니다.'] };

  const list = parseJobList(event.issue.body);
  const label = `${KIND_LABEL[parsed.kind]} ${parsed.slot}`;
  if (list.error) return { report: [`❌ ${label}: ${list.error}`] };
  // The staged workflow pins reviews to their declared batch. The legacy
  // compatibility path can still map a morning review to its open batch.
  const ledger = loadLedger(dataDir) ?? EMPTY_LEDGER();
  const date =
    parsed.kind === 'reviewer' && !enabled(env.JOB_ALERT_STRICT_BATCH)
      ? (openBatchDates(dataDir, ledger, now).at(-1) ?? parsed.date)
      : parsed.date;
  saveSubmission(dataDir, date, {
    kind: parsed.kind,
    slot: parsed.slot,
    date,
    receivedAt: now.toISOString(),
    jobs: list.jobs,
    rejected: list.rejected,
  });
  return {
    report: [
      `✅ ${label} (${date}): 공고 ${list.jobs.length}건 접수`,
      ...list.rejected.map(
        (item) => `- 제외 jobs[${item.index}]${item.title ? ` ${item.title}` : ''}: ${item.reason}`,
      ),
    ],
  };
}

async function prepareLedger({ dataDir, env, live, fetchImpl, now }) {
  const ledger = loadLedger(dataDir) ?? EMPTY_LEDGER();
  const firstRun = ledger.sentJobs.length === 0 && Object.keys(ledger.deliveries).length === 0;
  // The old digest owns delivery until cutover, so keep absorbing its catalog.
  if (firstRun || !live) {
    try {
      const response = await fetchImpl(new URL('/api/v1/jobs', env.CAREERGROUND_SITE_URL), {
        signal: globalThis.AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      mergeCatalogBaseline(ledger, await response.json());
    } catch (error) {
      // Without any baseline every open posting would look new; refuse to start.
      if (firstRun) throw new Error(`기존 공고 기준선을 불러오지 못했습니다: ${error.message}`);
    }
  }
  saveLedger(dataDir, ledger, now);
  return ledger;
}

const describeResult = (result) => {
  if (result.status === 'skipped') return `발송 안 함: ${result.reason}`;
  const { final } = result;
  const verb = result.status === 'sent' ? 'Slack 발송 완료' : 'Slack 미리보기(dry-run)';
  return `${verb}: 공고 ${final.jobs.length}건, 검증 ${final.reviewCount}개(통과 기준 ${final.quorum}), 검증 대기 ${final.heldCount}건`;
};

// Step 2, one run at a time. It reads every stored submission, so a queued run
// that GitHub cancels in favour of a newer one loses nothing.
export async function processAlert({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = new Date(),
} = {}) {
  const dataDir = env.JOB_ALERT_DATA_DIR;
  const event = readEvent(env);
  const eventName = env.GITHUB_EVENT_NAME;
  let trigger = eventName === 'schedule' ? 'schedule' : 'manual';
  if (eventName === 'issues') {
    const parsed = trustedSubmission(event);
    if (!parsed) return IGNORED;
    if (parsed.kind !== 'send') trigger = 'submission';
  }
  const dryRunInput = eventName === 'workflow_dispatch' && enabled(event.inputs?.dry_run);
  const live = enabled(env.JOB_ALERT_LIVE) && !dryRunInput;
  const force = eventName === 'workflow_dispatch' && enabled(event.inputs?.force);

  const ledger = await prepareLedger({ dataDir, env, live, fetchImpl, now });
  if (enabled(env.JOB_ALERT_DEFER_SEND)) {
    const pending = rebuildPending(dataDir, ledger, now, kstDateKey(now));
    return {
      report: ['발송 안 함: 제출 저장만 수행'],
      result: { status: 'skipped', reason: 'submission-only', pending },
    };
  }
  const result = await sendJobAlert({ dataDir, ledger, env, trigger, live, force, fetchImpl, now });
  return { report: [describeResult(result)], result };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = { receive, process: processAlert }[process.argv[2]];
  const writeReport = (text) => {
    process.stdout.write(`${text}\n`);
    if (process.env.JOB_ALERT_REPORT_FILE) {
      appendFileSync(process.env.JOB_ALERT_REPORT_FILE, `${text}\n`);
    }
  };
  Promise.resolve()
    .then(() => {
      if (!command) throw new Error('사용법: node scripts/job-alert/run.mjs receive|process');
      return command();
    })
    .then(({ report, result }) => {
      const text = report.join('\n');
      writeReport(text);
      if (process.env.GITHUB_STEP_SUMMARY) {
        const preview = result?.message
          ? `\n\n<details><summary>Slack 메시지</summary>\n\n\`\`\`json\n${JSON.stringify(result.message, null, 2)}\n\`\`\`\n</details>\n`
          : '';
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Job alert\n\n${text}${preview}\n`);
      }
    })
    .catch((error) => {
      process.exitCode = 1;
      writeReport(`❌ ${error instanceof Error ? error.message : String(error)}`);
    });
}
