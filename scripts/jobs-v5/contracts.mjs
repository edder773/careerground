export const SCHEMA_VERSION = '5.0';
export const WORKFLOW_ID = 'CG-JOBS-PROD-V5';
export const PARTITION_IDS = Object.freeze([1, 2, 3]);
export const MODES = Object.freeze(['DRY_RUN', 'RESUME', 'PUBLISH']);

export const RUN_STATUSES = Object.freeze([
  'PENDING',
  'RUNNING',
  'SUCCESS_WITH_CHANGES',
  'SUCCESS_NO_CHANGES',
  'SKIPPED_WEEKEND',
  'SKIPPED_HOLIDAY',
  'FAILED_PREFLIGHT',
  'FAILED_INPUT',
  'FAILED_COLLECTION',
  'FAILED_PARTITION',
  'FAILED_MERGE',
  'FAILED_VALIDATION',
  'QUARANTINED',
  'VERIFIED',
  'FAILED_DB_SYNC',
  'PUBLISHED',
  'FAILED_NOTIFICATION',
]);

const TERMINAL = new Set([
  'SKIPPED_WEEKEND',
  'SKIPPED_HOLIDAY',
  'FAILED_PREFLIGHT',
  'FAILED_INPUT',
  'FAILED_COLLECTION',
  'FAILED_PARTITION',
  'FAILED_MERGE',
  'FAILED_VALIDATION',
  'QUARANTINED',
  'FAILED_DB_SYNC',
  'FAILED_NOTIFICATION',
]);

const TRANSITIONS = new Map([
  ['PENDING', new Set(['RUNNING', 'SKIPPED_WEEKEND', 'SKIPPED_HOLIDAY', 'FAILED_PREFLIGHT'])],
  [
    'RUNNING',
    new Set([
      'FAILED_INPUT',
      'FAILED_COLLECTION',
      'FAILED_PARTITION',
      'FAILED_MERGE',
      'FAILED_VALIDATION',
      'QUARANTINED',
      'SUCCESS_WITH_CHANGES',
      'SUCCESS_NO_CHANGES',
    ]),
  ],
  ['SUCCESS_WITH_CHANGES', new Set(['VERIFIED', 'FAILED_VALIDATION', 'QUARANTINED'])],
  ['SUCCESS_NO_CHANGES', new Set(['VERIFIED', 'FAILED_VALIDATION', 'QUARANTINED'])],
  ['VERIFIED', new Set(['PUBLISHED', 'FAILED_DB_SYNC'])],
  ['PUBLISHED', new Set(['FAILED_NOTIFICATION'])],
]);

export class V5Error extends Error {
  constructor(code, message, status = 'FAILED_INPUT', details = undefined) {
    super(message);
    this.name = 'V5Error';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function assertTransition(from, to) {
  if (!RUN_STATUSES.includes(from) || !RUN_STATUSES.includes(to)) {
    throw new V5Error('INVALID_STATUS', `Unknown run status: ${from} -> ${to}`);
  }
  if (TERMINAL.has(from) || !TRANSITIONS.get(from)?.has(to)) {
    throw new V5Error('INVALID_STATUS_TRANSITION', `Forbidden run transition: ${from} -> ${to}`);
  }
  return true;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

export function assertIsoDate(value, field = 'date') {
  if (!ISO_DATE.test(String(value)) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
    throw new V5Error('INVALID_DATE', `${field} must be YYYY-MM-DD.`);
  }
  return value;
}

export function assertIsoTimestamp(value, field = 'timestamp', optional = false) {
  if (optional && (value === null || value === undefined)) return value;
  if (!ISO_TIMESTAMP.test(String(value)) || Number.isNaN(new Date(value).getTime())) {
    throw new V5Error('INVALID_TIMESTAMP', `${field} must be an ISO-8601 timestamp.`);
  }
  return value;
}

export function assertExecutionIdentity(identity) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) {
    throw new V5Error('INVALID_IDENTITY', 'Execution identity must be an object.');
  }
  if (identity.schemaVersion !== SCHEMA_VERSION) {
    throw new V5Error('SCHEMA_VERSION_MISMATCH', `schemaVersion must be ${SCHEMA_VERSION}.`);
  }
  if (identity.workflowId !== WORKFLOW_ID) {
    throw new V5Error('WORKFLOW_ID_MISMATCH', `workflowId must be ${WORKFLOW_ID}.`);
  }
  assertIsoDate(identity.targetAsOfDate, 'targetAsOfDate');
  if (identity.runGroupKey !== `CG-${identity.targetAsOfDate}`) {
    throw new V5Error('RUN_GROUP_MISMATCH', 'runGroupKey must match targetAsOfDate.');
  }
  if (!/^CG-\d{4}-\d{2}-\d{2}-A\d+-[a-zA-Z0-9-]+$/.test(String(identity.runId))) {
    throw new V5Error('INVALID_RUN_ID', 'runId does not match the v5 format.');
  }
  if (!Number.isInteger(identity.attempt) || identity.attempt < 1) {
    throw new V5Error('INVALID_ATTEMPT', 'attempt must be a positive integer.');
  }
  if (!MODES.includes(identity.mode)) throw new V5Error('INVALID_MODE', 'Unsupported run mode.');
  if (!RUN_STATUSES.includes(identity.status)) {
    throw new V5Error('INVALID_STATUS', 'Unsupported run status.');
  }
  assertIsoTimestamp(identity.startedAt, 'startedAt');
  assertIsoTimestamp(identity.completedAt, 'completedAt', true);
  if (
    identity.previousSuccessfulRunId !== null &&
    typeof identity.previousSuccessfulRunId !== 'string'
  ) {
    throw new V5Error('INVALID_PREVIOUS_RUN', 'previousSuccessfulRunId must be a string or null.');
  }
  for (const field of ['errorCode', 'errorMessage']) {
    if (identity[field] !== null && typeof identity[field] !== 'string') {
      throw new V5Error('INVALID_ERROR_FIELD', `${field} must be a string or null.`);
    }
  }
  return identity;
}

export function createExecutionIdentity({
  targetAsOfDate,
  attempt = 1,
  mode = 'DRY_RUN',
  previousSuccessfulRunId = null,
  now = new Date(),
  nonce = globalThis.crypto.randomUUID().slice(0, 8),
}) {
  assertIsoDate(targetAsOfDate, 'targetAsOfDate');
  const identity = {
    schemaVersion: SCHEMA_VERSION,
    workflowId: WORKFLOW_ID,
    runId: `CG-${targetAsOfDate}-A${attempt}-${nonce}`,
    runGroupKey: `CG-${targetAsOfDate}`,
    targetAsOfDate,
    attempt,
    mode,
    startedAt: now.toISOString(),
    completedAt: null,
    status: 'PENDING',
    previousSuccessfulRunId,
    errorCode: null,
    errorMessage: null,
  };
  return assertExecutionIdentity(identity);
}

export function transition(identity, status, patch = {}) {
  assertTransition(identity.status, status);
  const completedAt =
    TERMINAL.has(status) || status === 'PUBLISHED' ? new Date().toISOString() : null;
  return assertExecutionIdentity({ ...identity, ...patch, status, completedAt });
}
