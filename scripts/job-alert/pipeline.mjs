import {
  duplicateJobReason,
  jobCompanyKey,
  jobComparisonCompanyKeys,
} from '../../deployment/sites/job-dedup.ts';
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

// Postings open only to a protected group (보훈, 장애인 전형) are not open to
// the new graduates this alert is for.
const RESTRICTED_ELIGIBILITY = /보훈|장애인|북한이탈|취업지원\s*대상자/u;
export const isRestricted = (job) => RESTRICTED_ELIGIBILITY.test(job.title);

// Same URL, or the same posting mirrored on another job board.
const samePosting = (left, right) =>
  jobKey(left) === jobKey(right) || Boolean(duplicateJobReason(left, right));

const compact = (value) =>
  String(value ?? '')
    .replace(/\(주\)|㈜|주식회사/gu, '')
    .replace(/\s+/gu, '');
const deadlineDay = (job) => String(job.deadlineAt ?? '').slice(0, 10);

// A subsidiary's posting is also listed under its parent company, and that
// title still names the hiring company: "AC Digital팀 [삼일피더블유씨…] 웹서비스
// 개발자 신입 채용" under 삼일회계법인 is the 삼일피더블유씨… posting.
const namesHiringCompany = (listing, posting) => {
  const company = compact(posting.companyName);
  const title = compact(listing.title);
  if (company.length < 4 || !title.includes(company)) return false;
  const role = compact(posting.title).replace(`[${company}]`, '').replace(company, '');
  return role.length >= 6 && title.includes(role) && deadlineDay(listing) === deadlineDay(posting);
};

const listedUnderParent = (left, right) =>
  jobCompanyKey(left.companyName) !== jobCompanyKey(right.companyName) &&
  (namesHiringCompany(left, right) || namesHiringCompany(right, left));

class JobIndex {
  #keys = new Set();
  #byCompany = new Map();
  #all = [];

  constructor(jobs = []) {
    for (const job of jobs) this.add(job);
  }

  add(job) {
    this.#keys.add(jobKey(job));
    this.#all.push(job);
    for (const company of jobComparisonCompanyKeys(job)) {
      this.#byCompany.set(company, [...(this.#byCompany.get(company) ?? []), job]);
    }
  }

  has(job) {
    if (this.#keys.has(jobKey(job))) return true;
    const sameCompany = this.#byCompany.get(jobCompanyKey(job.companyName)) ?? [];
    return (
      sameCompany.some((other) => samePosting(job, other)) ||
      this.#all.some((other) => listedUnderParent(job, other))
    );
  }
}

// Union of every collector list: format checks, expiry, restricted eligibility,
// already-sent, and cross-source duplicates are decided here by code, not by a
// reviewer.
export function buildPending({ collectors, sentJobs, now }) {
  const sent = new JobIndex(sentJobs);
  const accepted = new JobIndex();
  const jobs = [];
  const skipped = { notAlertable: 0, restricted: 0, alreadySent: 0, duplicate: 0 };
  for (const submission of collectors) {
    for (const job of submission.jobs) {
      if (!isAlertable(job, now)) skipped.notAlertable += 1;
      else if (isRestricted(job)) skipped.restricted += 1;
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
