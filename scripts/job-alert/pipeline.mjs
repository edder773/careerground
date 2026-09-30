import { duplicateJobReason, jobCompanyKey } from '../../deployment/sites/job-dedup.ts';
import { jobKey } from './job-list.mjs';

// Reviewers ask the same question, so two agreeing reviewers are enough.
// With fewer reviews available, every available reviewer must agree.
export const REVIEW_QUORUM = 2;

// Slack keeps the current product rule: only postings with a known future deadline.
export const isAlertable = (job, now) =>
  !job.rolling && Boolean(job.deadlineAt) && Date.parse(job.deadlineAt) > now.getTime();

const byDeadline = (left, right) =>
  Date.parse(left.deadlineAt) - Date.parse(right.deadlineAt) ||
  left.companyName.localeCompare(right.companyName, 'ko') ||
  left.title.localeCompare(right.title, 'ko');

// Same URL, or the same posting mirrored on another job board.
const samePosting = (left, right) =>
  jobKey(left) === jobKey(right) || Boolean(duplicateJobReason(left, right));

class JobIndex {
  #keys = new Set();
  #byCompany = new Map();

  constructor(jobs = []) {
    for (const job of jobs) this.add(job);
  }

  add(job) {
    this.#keys.add(jobKey(job));
    const company = jobCompanyKey(job.companyName);
    this.#byCompany.set(company, [...(this.#byCompany.get(company) ?? []), job]);
  }

  has(job) {
    if (this.#keys.has(jobKey(job))) return true;
    return (this.#byCompany.get(jobCompanyKey(job.companyName)) ?? []).some((other) =>
      samePosting(job, other),
    );
  }
}

// Union of every collector list: format checks, expiry, already-sent, and
// cross-source duplicates are decided here by code, not by a reviewer.
export function buildPending({ collectors, sentJobs, now }) {
  const sent = new JobIndex(sentJobs);
  const accepted = new JobIndex();
  const jobs = [];
  const skipped = { notAlertable: 0, alreadySent: 0, duplicate: 0 };
  for (const submission of collectors) {
    for (const job of submission.jobs) {
      if (!isAlertable(job, now)) skipped.notAlertable += 1;
      else if (sent.has(job)) skipped.alreadySent += 1;
      else if (accepted.has(job)) skipped.duplicate += 1;
      else {
        accepted.add(job);
        jobs.push(job);
      }
    }
  }
  return { jobs: jobs.sort(byDeadline), skipped };
}

// Final jobs keep the pending copy of each posting, so a reviewer can pass or
// drop a job but never rewrite its link, company, or deadline.
export function buildFinal({ pending, reviews, now }) {
  const quorum = Math.min(REVIEW_QUORUM, reviews.length);
  if (quorum === 0) {
    return { jobs: [], heldCount: pending.jobs.length, quorum, reviewCount: 0, notPassed: 0 };
  }
  const reviewIndexes = reviews.map((review) => new JobIndex(review.jobs));
  const jobs = pending.jobs.filter(
    (job) =>
      isAlertable(job, now) && reviewIndexes.filter((index) => index.has(job)).length >= quorum,
  );
  return {
    jobs,
    heldCount: 0,
    quorum,
    reviewCount: reviews.length,
    notPassed: pending.jobs.length - jobs.length,
  };
}
