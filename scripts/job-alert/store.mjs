import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { canonicalizeHttpUrl } from '../jobs-v5/canonical-json.mjs';
import { jobKey, kstDateKey } from './job-list.mjs';
import { buildPending } from './pipeline.mjs';

// Layout of the job-alert-data branch:
//   ledger.json                         sent jobs and one delivery per day
//   batches/<date>/collector-<n>.json   normalized collector lists
//   batches/<date>/reviewer-<n>.json    normalized reviewer lists for that batch
//   pending.json                        the list reviewers read
const OPEN_BATCH_DAYS = 14;
const SENT_JOB_RETENTION_DAYS = 180;
const EXPIRED_JOB_RETENTION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export const readJson = (path, fallback = null) =>
  existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;

export const writeJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

export const loadLedger = (dir) => readJson(join(dir, 'ledger.json'));

export function saveLedger(dir, ledger, now) {
  // An expired posting can never be alerted again, and neither can its mirrors.
  const expiredBefore = now.getTime() - EXPIRED_JOB_RETENTION_DAYS * DAY_MS;
  const sentBefore = kstDateKey(new Date(now.getTime() - SENT_JOB_RETENTION_DAYS * DAY_MS));
  writeJson(join(dir, 'ledger.json'), {
    ...ledger,
    sentJobs: ledger.sentJobs.filter((job) =>
      job.deadlineAt
        ? Date.parse(job.deadlineAt) >= expiredBefore
        : job.sentOn === 'catalog' || job.sentOn >= sentBefore,
    ),
  });
}

export const ledgerEntry = (job, sentOn) => ({
  companyName: job.companyName,
  title: job.title,
  sourceUrl: job.sourceUrl,
  deadlineAt: job.deadlineAt ?? null,
  applicationStartAt: job.applicationStartAt ?? null,
  sentOn,
});

// While the old CareerGround digest is still live, its catalog is the record of
// what has already reached Slack. Merge it so the new path never repeats a job.
export function mergeCatalogBaseline(ledger, catalogJobs) {
  const known = new Set(ledger.sentJobs.map(jobKey));
  let added = 0;
  for (const job of catalogJobs) {
    let sourceUrl;
    try {
      sourceUrl = canonicalizeHttpUrl(job.sourceUrl);
    } catch {
      continue;
    }
    const companyName = String(job.company?.name ?? job.companyName ?? '').trim();
    if (!companyName || !job.title || known.has(sourceUrl)) continue;
    known.add(sourceUrl);
    ledger.sentJobs.push(ledgerEntry({ ...job, companyName, sourceUrl }, 'catalog'));
    added += 1;
  }
  return added;
}

const deliveredBatches = (ledger) =>
  new Set(Object.values(ledger.deliveries).flatMap((delivery) => delivery.batches ?? []));

export function openBatchDates(dir, ledger, now) {
  const batchesDir = join(dir, 'batches');
  if (!existsSync(batchesDir)) return [];
  const today = kstDateKey(now);
  const oldest = kstDateKey(new Date(now.getTime() - OPEN_BATCH_DAYS * DAY_MS));
  const delivered = deliveredBatches(ledger);
  return readdirSync(batchesDir)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/u.test(date))
    .filter((date) => date >= oldest && date <= today && !delivered.has(date))
    .sort();
}

export function loadSubmissions(dir, date, kind) {
  const batchDir = join(dir, 'batches', date);
  if (!existsSync(batchDir)) return [];
  return readdirSync(batchDir)
    .filter((name) => new RegExp(`^${kind}-\\d+\\.json$`, 'u').test(name))
    .map((name) => readJson(join(batchDir, name)))
    .sort((left, right) => left.slot - right.slot);
}

export const saveSubmission = (dir, date, submission) =>
  writeJson(join(dir, 'batches', date, `${submission.kind}-${submission.slot}.json`), submission);

export function rebuildPending(dir, ledger, now) {
  const batches = openBatchDates(dir, ledger, now);
  const collectors = batches.flatMap((date) => loadSubmissions(dir, date, 'collector'));
  const { jobs, skipped } = buildPending({ collectors, sentJobs: ledger.sentJobs, now });
  const pending = {
    date: batches.at(-1) ?? null,
    batches,
    generatedAt: now.toISOString(),
    collectorCount: collectors.length,
    skipped,
    jobs,
  };
  writeJson(join(dir, 'pending.json'), pending);
  return pending;
}
