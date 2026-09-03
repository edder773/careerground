import { RouteError, type D1Env } from './d1-api-contract.js';
import { secureTokenMatch } from './d1-daily-challenges.js';
import { sha256 } from './domain.js';
import { inspectDiscoveryEnums } from '../../scripts/jobs-v5/canonical-policy.mjs';

const V5_WORKFLOW_ID = 'CG-JOBS-PROD-V5';
const DISCOVERY_SCHEMA_VERSION = '5.1';
const DISCOVERY_PUBLISH_ARTIFACT_TYPE = 'CAREERGROUND_DISCOVERY_PUBLISH_REQUEST';
const MAX_DISCOVERY_ITEMS = 500;
const UNORDERED_ARRAY_KEYS = new Set(['sources', 'techStack', 'tags', 'excludedReasons']);

export type V5DiscoveryPublishRequest = {
  schemaVersion: '5.1';
  artifactType: 'CAREERGROUND_DISCOVERY_PUBLISH_REQUEST';
  workflowId: 'CG-JOBS-PROD-V5';
  runId: string;
  runGroupKey: string;
  targetAsOfDate: string;
  attempt: number;
  report: Record<string, unknown>;
  partitions: Array<Record<string, unknown>>;
};

function canonicalValue(value: unknown, parentKey = ''): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => canonicalValue(entry));
    if (UNORDERED_ARRAY_KEYS.has(parentKey)) {
      normalized.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    } else if (parentKey === 'items') {
      normalized.sort((left, right) =>
        String((left as Record<string, unknown>)?.canonicalJobKey || '').localeCompare(
          String((right as Record<string, unknown>)?.canonicalJobKey || ''),
        ),
      );
    }
    return normalized;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalValue(entry, key)]),
    );
  }
  return value;
}

async function canonicalChecksum(value: unknown) {
  return sha256(JSON.stringify(canonicalValue(value)));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function requiredString(value: unknown, field: string, maxLength = 5_000) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`${field} is missing or exceeds ${maxLength} characters.`);
  }
  return normalized;
}

function optionalIso(value: unknown, field: string) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = requiredString(value, field, 64);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} must be an ISO-8601 timestamp.`);
  return normalized;
}

function kstDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value);
}

function safeHttpUrl(value: unknown, field: string) {
  const normalized = requiredString(value, field, 2_048);
  const url = new URL(normalized);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error(`${field} must be a public HTTP(S) URL without credentials or a fragment.`);
  }
  return url.toString();
}

function canonicalJobKey(job: Record<string, unknown>, sourceUrl: string) {
  const sourcePostingId = String(job.sourcePostingId ?? '').trim();
  return sourcePostingId
    ? `source:${new URL(sourceUrl).hostname.toLowerCase()}:${sourcePostingId.toLowerCase()}`
    : `url:${sourceUrl.toLowerCase()}`;
}

async function validateDiscoveryJob(
  value: unknown,
  targetAsOfDate: string,
  now: Date,
  field: string,
) {
  if (!isRecord(value)) throw new Error(`${field} must be an object.`);
  const sourceUrl = safeHttpUrl(value.sourceUrl, `${field}.sourceUrl`);
  const sourceName = requiredString(value.sourceName, `${field}.sourceName`, 160);
  const companyName = requiredString(value.companyName, `${field}.companyName`, 240);
  const title = requiredString(value.title, `${field}.title`, 500);
  const category = requiredString(value.category, `${field}.category`, 160);
  const careerScope = requiredString(value.careerScope, `${field}.careerScope`, 64);
  const careerEvidence = requiredString(value.careerEvidence, `${field}.careerEvidence`, 5_000);
  const employmentType = requiredString(value.employmentType, `${field}.employmentType`, 160);
  const region = requiredString(value.region, `${field}.region`, 500);
  const summary = requiredString(value.summary, `${field}.summary`, 10_000);
  const companySize = requiredString(
    value.companySize || 'UNCLASSIFIED',
    `${field}.companySize`,
    32,
  );
  const enumInspection = inspectDiscoveryEnums({ careerScope, employmentType, companySize });
  const enumProblem = enumInspection.violations[0] ?? enumInspection.changes[0];
  if (enumProblem) {
    throw new Error(`${field}.${enumProblem.field} must use a supported canonical value.`);
  }
  if (value.status !== 'ACTIVE') {
    throw new Error(`${field} must be an ACTIVE new-grad posting.`);
  }
  const rolling = value.rolling === true;
  const deadlineAt = optionalIso(value.deadlineAt, `${field}.deadlineAt`);
  if (!rolling && !deadlineAt) throw new Error(`${field} needs a future deadline or rolling=true.`);
  if (deadlineAt && new Date(deadlineAt).getTime() <= now.getTime()) {
    throw new Error(`${field}.deadlineAt has already passed.`);
  }
  const lastVerifiedAt = requiredString(value.lastVerifiedAt, `${field}.lastVerifiedAt`, 64);
  if (
    Number.isNaN(new Date(lastVerifiedAt).getTime()) ||
    kstDate(lastVerifiedAt) !== targetAsOfDate
  ) {
    throw new Error(`${field}.lastVerifiedAt must use the target Asia/Seoul date.`);
  }
  const expectedId = `job-${(await sha256(sourceUrl)).slice(0, 24)}`;
  if (value.id !== expectedId) throw new Error(`${field}.id does not match sourceUrl.`);
  const fingerprintInput = [companyName, title, region, employmentType]
    .map((entry) => entry.trim().toLowerCase())
    .join('|');
  const fingerprint = await sha256(fingerprintInput);
  if (value.fingerprint !== fingerprint) {
    throw new Error(`${field}.fingerprint does not match the canonical fields.`);
  }
  const techStack = Array.isArray(value.techStack)
    ? value.techStack.map((entry) => String(entry).trim()).filter(Boolean)
    : [];
  if (techStack.length > 100) throw new Error(`${field}.techStack is too large.`);
  const timestamp = now.toISOString();
  return {
    ...value,
    id: expectedId,
    canonicalJobKey: canonicalJobKey(value, sourceUrl),
    fingerprint,
    sourceUrl,
    sourceName,
    sourcePostingId: String(value.sourcePostingId ?? '').trim() || null,
    companyName,
    companySize,
    companySizeEvidence: String(value.companySizeEvidence ?? '').trim(),
    title,
    category,
    careerScope,
    careerEvidence,
    employmentType,
    region,
    remote: value.remote === true,
    techStack,
    publishedAt: optionalIso(value.publishedAt, `${field}.publishedAt`),
    applicationStartAt: optionalIso(value.applicationStartAt, `${field}.applicationStartAt`),
    deadlineAt,
    rolling,
    summary,
    status: 'ACTIVE',
    collectedAt: timestamp,
    lastVerifiedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function validateDiscoveryPublishRequest(value: unknown, now: Date) {
  if (!isRecord(value)) throw new Error('Discovery publish request must be an object.');
  const request = value as unknown as V5DiscoveryPublishRequest;
  if (
    request.schemaVersion !== DISCOVERY_SCHEMA_VERSION ||
    request.artifactType !== DISCOVERY_PUBLISH_ARTIFACT_TYPE ||
    request.workflowId !== V5_WORKFLOW_ID
  ) {
    throw new Error('Discovery publish request identity is invalid.');
  }
  const targetAsOfDate = requiredString(request.targetAsOfDate, 'targetAsOfDate', 10);
  const acceptedTargetDates = new Set([
    kstDate(now),
    kstDate(new Date(now.getTime() - 86_400_000)),
  ]);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(targetAsOfDate) || !acceptedTargetDates.has(targetAsOfDate)) {
    throw new Error('targetAsOfDate must be the current or previous Asia/Seoul date.');
  }
  const runGroupKey = `CG-${targetAsOfDate}`;
  if (request.runGroupKey !== runGroupKey) throw new Error('runGroupKey is invalid.');
  if (
    !Number.isInteger(request.attempt) ||
    request.attempt < 1 ||
    request.attempt > 99 ||
    request.runId !== `${runGroupKey}-A${request.attempt}-discovery`
  ) {
    throw new Error('The deterministic runId or attempt is invalid.');
  }
  if (!isRecord(request.report)) throw new Error('discovery report is required.');
  if (
    request.report.schemaVersion !== DISCOVERY_SCHEMA_VERSION ||
    request.report.artifactType !== 'CAREERGROUND_DISCOVERY_BUNDLE_REPORT' ||
    request.report.workflowId !== V5_WORKFLOW_ID ||
    request.report.runId !== request.runId ||
    request.report.runGroupKey !== runGroupKey ||
    request.report.targetAsOfDate !== targetAsOfDate ||
    request.report.status !== 'VERIFIED_DISCOVERY' ||
    request.report.productionDatabaseChanged !== false ||
    request.report.slackSent !== false ||
    Number(request.report.potentialDuplicateCount || 0) !== 0
  ) {
    throw new Error('Discovery report did not pass the publish boundary.');
  }
  if (!Array.isArray(request.partitions) || request.partitions.length !== 3) {
    throw new Error('Exactly three normalized discovery partitions are required.');
  }
  const partitionIds = new Set<number>();
  const jobs: Array<Record<string, unknown>> = [];
  let startedAt = now.toISOString();
  for (const [partitionIndex, partitionValue] of request.partitions.entries()) {
    if (!isRecord(partitionValue)) throw new Error(`partitions[${partitionIndex}] is invalid.`);
    const partitionId = Number(partitionValue.partitionId);
    if (
      partitionValue.schemaVersion !== '5.0' ||
      partitionValue.workflowId !== V5_WORKFLOW_ID ||
      partitionValue.runId !== request.runId ||
      partitionValue.runGroupKey !== runGroupKey ||
      partitionValue.targetAsOfDate !== targetAsOfDate ||
      partitionValue.status !== 'SUCCESS' ||
      ![1, 2, 3].includes(partitionId) ||
      partitionIds.has(partitionId) ||
      !Array.isArray(partitionValue.items) ||
      Number(partitionValue.rowCount) !== partitionValue.items.length
    ) {
      throw new Error(`partitions[${partitionIndex}] failed its identity contract.`);
    }
    partitionIds.add(partitionId);
    const partitionStartedAt = optionalIso(
      partitionValue.startedAt,
      `partitions[${partitionIndex}].startedAt`,
    );
    if (partitionStartedAt && partitionStartedAt < startedAt) startedAt = partitionStartedAt;
    for (const [itemIndex, item] of partitionValue.items.entries()) {
      jobs.push(
        await validateDiscoveryJob(
          item,
          targetAsOfDate,
          now,
          `partitions[${partitionIndex}].items[${itemIndex}]`,
        ),
      );
    }
  }
  if (jobs.length > MAX_DISCOVERY_ITEMS || Number(request.report.rowCount) !== jobs.length) {
    throw new Error(`Discovery row count exceeds ${MAX_DISCOVERY_ITEMS} or does not match.`);
  }
  const unique = (field: string) => new Set(jobs.map((job) => String(job[field]))).size;
  if (
    unique('id') !== jobs.length ||
    unique('sourceUrl') !== jobs.length ||
    unique('canonicalJobKey') !== jobs.length ||
    unique('fingerprint') !== jobs.length
  ) {
    throw new Error('Discovery jobs contain an identifier or fingerprint collision.');
  }
  return { request, jobs, startedAt, sourceChecksum: await canonicalChecksum(request) };
}

export async function requirePublishToken(request: Request, env: D1Env) {
  const expected = String(env.PUBLISH_API_TOKEN || '').trim();
  if (!expected) {
    throw new RouteError(
      503,
      '운영 채용공고 반영 인증이 구성되지 않았습니다.',
      'PUBLISH_AUTH_NOT_CONFIGURED',
    );
  }
  const authorization = request.headers.get('authorization') || '';
  const actual = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!actual || !(await secureTokenMatch(actual, expected))) {
    throw new RouteError(401, '운영 채용공고 반영 인증에 실패했습니다.', 'PUBLISH_UNAUTHORIZED');
  }
}
