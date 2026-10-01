import { URL } from 'node:url';
import { canonicalizeHttpUrl } from '../jobs-v5/canonical-json.mjs';
import { inspectDiscoveryEnums } from '../jobs-v5/canonical-policy.mjs';

// One job-list format is shared by collectors, reviewers, and the final alert.
// A malformed job is rejected on its own; it never blocks the rest of the list.
export const SUBMISSION_SLOTS = Object.freeze({ collector: 5, reviewer: 3 });
export const CAREER_SCOPES = Object.freeze(['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'UNCLASSIFIED']);

const IT_ROLE_MAX_LENGTH = 80;
const TITLE_PATTERN =
  /^\s*\[JOB-ALERT\]\s*\[(\d{4}-\d{2}-\d{2})\]\s*\[(collector|reviewer)-(\d+)\]\s*$/iu;
const SEND_TITLE_PATTERN = /^\s*\[JOB-ALERT\]\s*\[(\d{4}-\d{2}-\d{2})\]\s*\[send\]\s*$/iu;
const ROLLING_TEXT = /^(?:상시|수시|채용\s*시|충원\s*시|모집\s*완료\s*시|rolling|until filled)/iu;
const DATE_TEXT =
  /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/iu;

const text = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .trim();

const pad = (value) => String(value).padStart(2, '0');

export function kstDateKey(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function kstMinutes(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return (Number(parts.hour) % 24) * 60 + Number(parts.minute);
}

const toKstIso = (date) => {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return (
    `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}` +
    `T${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}:00+09:00`
  );
};

// Date-only deadlines close at the end of that Korean day. Times without an
// offset are Korean local times because every source is a Korean posting.
export function normalizeDeadline(value) {
  if (value === null || value === undefined) return { deadlineAt: null, rolling: false };
  const raw = text(value);
  if (!raw || /^(?:null|none|n\/a|미정|없음)$/iu.test(raw)) {
    return { deadlineAt: null, rolling: false };
  }
  if (ROLLING_TEXT.test(raw)) return { deadlineAt: null, rolling: true };
  const match = DATE_TEXT.exec(raw);
  if (!match) return { error: `deadlineAt "${raw}"을(를) 날짜로 읽을 수 없습니다.` };
  const [, year, month, day, hour, minute, second, zone] = match;
  const offset = !zone
    ? '+09:00'
    : zone.toUpperCase() === 'Z'
      ? 'Z'
      : `${zone.slice(0, 3)}:${zone.slice(-2)}`;
  const time = hour === undefined ? '23:59:00' : `${pad(hour)}:${minute}:${second ?? '00'}`;
  const parsed = new Date(`${year}-${pad(month)}-${pad(day)}T${time}${offset}`);
  if (Number.isNaN(parsed.getTime())) {
    return { error: `deadlineAt "${raw}"을(를) 날짜로 읽을 수 없습니다.` };
  }
  return { deadlineAt: toKstIso(parsed), rolling: false };
}

const booleanValue = (value) =>
  value === true || ['true', '1', 'yes', 'y'].includes(text(value).toLowerCase());

const careerScope = (value) => {
  const normalized = inspectDiscoveryEnums({ careerScope: value }).values.careerScope;
  return CAREER_SCOPES.includes(normalized) ? normalized : 'UNCLASSIFIED';
};

const sourceNameFromUrl = (url) =>
  new URL(url).hostname.replace(/^(?:www|m)\./u, '').split('.')[0] || 'unknown';

export const jobKey = (job) => job.sourceUrl;

export function normalizeJob(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: '공고가 JSON 객체가 아닙니다.' };
  }
  const companyName = text(raw.companyName ?? raw.company?.name ?? raw.company);
  const title = text(raw.title);
  if (!companyName) return { error: 'companyName이 비어 있습니다.' };
  if (!title) return { error: 'title이 비어 있습니다.' };

  let sourceUrl;
  try {
    sourceUrl = canonicalizeHttpUrl(text(raw.sourceUrl ?? raw.url));
  } catch {
    return { error: 'sourceUrl이 http(s) 주소가 아닙니다.' };
  }

  const deadline = normalizeDeadline(raw.deadlineAt ?? raw.deadline);
  if (deadline.error) return { error: deadline.error };
  const start = raw.applicationStartAt ? normalizeDeadline(raw.applicationStartAt) : {};
  // A recruitment that hires many roles names its IT roles here, because its
  // title alone ("2026 신입사원 공개채용") does not say it is an IT posting.
  const itRole = text(raw.itRole).slice(0, IT_ROLE_MAX_LENGTH);

  return {
    job: {
      companyName,
      title,
      sourceName:
        text(raw.sourceName ?? raw.source?.name ?? raw.source) || sourceNameFromUrl(sourceUrl),
      sourceUrl,
      deadlineAt: deadline.deadlineAt,
      rolling: deadline.rolling || booleanValue(raw.rolling),
      careerScope: careerScope(raw.careerScope),
      ...(start.deadlineAt ? { applicationStartAt: start.deadlineAt } : {}),
      ...(itRole && !/^(?:null|none|n\/a|없음)$/iu.test(itRole) ? { itRole } : {}),
    },
  };
}

// Accepts raw JSON or JSON inside a ```json fence, which chat tools tend to add.
export function extractJson(body) {
  const source = String(body ?? '');
  const fenced = /```(?:json)?\s*\n([\s\S]*?)```/iu.exec(source);
  const candidate = fenced ? fenced[1] : source;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('본문에서 JSON 객체를 찾지 못했습니다.');
  return JSON.parse(candidate.slice(start, end + 1));
}

export function parseSubmissionTitle(title) {
  const send = SEND_TITLE_PATTERN.exec(String(title ?? ''));
  if (send) return { kind: 'send', date: send[1] };
  const match = TITLE_PATTERN.exec(String(title ?? ''));
  if (!match) return null;
  const kind = match[2].toLowerCase();
  const slot = Number(match[3]);
  if (slot < 1 || slot > SUBMISSION_SLOTS[kind]) return null;
  return { kind, slot, date: match[1] };
}

export function parseJobList(body) {
  let value;
  try {
    value = extractJson(body);
  } catch (error) {
    return { error: `JSON을 읽을 수 없습니다: ${error instanceof Error ? error.message : error}` };
  }
  const list = Array.isArray(value?.jobs)
    ? value.jobs
    : Array.isArray(value?.items)
      ? value.items
      : null;
  if (!list) return { error: 'JSON 최상위에 jobs 배열이 없습니다.' };

  const jobs = [];
  const rejected = [];
  const seen = new Set();
  list.forEach((raw, index) => {
    const result = normalizeJob(raw);
    if (result.error) {
      rejected.push({ index, reason: result.error, title: text(raw?.title) || null });
      return;
    }
    if (seen.has(jobKey(result.job))) return;
    seen.add(jobKey(result.job));
    jobs.push(result.job);
  });
  return { jobs, rejected };
}
