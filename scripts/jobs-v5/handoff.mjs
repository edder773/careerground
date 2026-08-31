#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL, URLSearchParams } from 'node:url';

export const HANDOFF_LABEL = 'careerground-v5-handoff';
export const PROCESSED_LABEL = 'careerground-v5-handoff-processed';
export const HANDOFF_SCHEMA_VERSION = '2.0';
export const LEGACY_HANDOFF_SCHEMA_VERSION = '1.0';
export const HANDOFF_WORKFLOW_ID = 'CG-JOBS-PROD-V5';

export const processedIssueUpdate = () => ({ state: 'closed', state_reason: 'completed' });

const MAX_ARTIFACT_BYTES = 1_000_000;
const TRUSTED_AUTHOR_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const PARTITION_ARTIFACT_KINDS = ['PARTITION_1', 'PARTITION_2', 'PARTITION_3'];
const LEGACY_ARTIFACT_KINDS = [
  'PARTITION_1',
  'PARTITION_2',
  'PARTITION_3',
  'LEGACY_FINAL',
  'LEGACY_AUDIT',
];

function requiredArtifactKinds(schemaVersion) {
  return schemaVersion === LEGACY_HANDOFF_SCHEMA_VERSION
    ? LEGACY_ARTIFACT_KINDS
    : PARTITION_ARTIFACT_KINDS;
}

function fail(code, message, details = undefined) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function labelsFor(issue) {
  return new Set(
    Array.isArray(issue?.labels)
      ? issue.labels.map((label) => (typeof label === 'string' ? label : String(label?.name || '')))
      : [],
  );
}

function expectedFileName(kind, targetAsOfDate) {
  if (kind.startsWith('PARTITION_')) {
    return `careerground-partition-${kind.at(-1)}-${targetAsOfDate}.json`;
  }
  if (kind === 'LEGACY_FINAL') {
    return `careerground-jobs-live-${targetAsOfDate}-final.json`;
  }
  return `careerground-merge-audit-${targetAsOfDate}.json`;
}

export function rawSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function parseHandoffPointer(body) {
  if (typeof body !== 'string') fail('HANDOFF_BODY_MISSING', 'Handoff issue body is missing.');
  const match = body.match(/<!--\s*CAREERGROUND_V5_HANDOFF\s*([\s\S]*?)\s*-->/u);
  if (!match) fail('HANDOFF_MARKER_MISSING', 'Handoff issue marker is missing.');
  let pointer;
  try {
    pointer = JSON.parse(match[1]);
  } catch {
    fail('HANDOFF_POINTER_JSON_INVALID', 'Handoff pointer is not valid JSON.');
  }
  if (!isRecord(pointer)) fail('HANDOFF_POINTER_INVALID', 'Handoff pointer must be an object.');
  const allowedFields = new Set([
    'schemaVersion',
    'workflowId',
    'targetAsOfDate',
    'artifactKind',
    'attempt',
    'blobSha',
    'rawSha256',
    'byteLength',
    'fileName',
  ]);
  const unexpected = Object.keys(pointer).filter((field) => !allowedFields.has(field));
  if (unexpected.length) {
    fail('HANDOFF_POINTER_FIELD_FORBIDDEN', 'Handoff pointer has unexpected fields.', {
      unexpected,
    });
  }
  if (
    ![HANDOFF_SCHEMA_VERSION, LEGACY_HANDOFF_SCHEMA_VERSION].includes(pointer.schemaVersion) ||
    pointer.workflowId !== HANDOFF_WORKFLOW_ID
  ) {
    fail('HANDOFF_IDENTITY_INVALID', 'Handoff schemaVersion or workflowId is invalid.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(String(pointer.targetAsOfDate))) {
    fail('HANDOFF_DATE_INVALID', 'targetAsOfDate must be YYYY-MM-DD.');
  }
  if (!requiredArtifactKinds(pointer.schemaVersion).includes(pointer.artifactKind)) {
    fail('HANDOFF_KIND_INVALID', 'artifactKind is invalid.');
  }
  if (!Number.isInteger(pointer.attempt) || pointer.attempt < 1 || pointer.attempt > 99) {
    fail('HANDOFF_ATTEMPT_INVALID', 'attempt must be an integer from 1 to 99.');
  }
  if (!/^[a-f0-9]{40}$/u.test(String(pointer.blobSha))) {
    fail('HANDOFF_BLOB_SHA_INVALID', 'blobSha must be a lowercase 40-character Git SHA.');
  }
  if (pointer.schemaVersion === LEGACY_HANDOFF_SCHEMA_VERSION) {
    if (!/^[a-f0-9]{64}$/u.test(String(pointer.rawSha256))) {
      fail('HANDOFF_RAW_SHA_INVALID', 'rawSha256 must be a lowercase SHA-256 digest.');
    }
    if (
      !Number.isInteger(pointer.byteLength) ||
      pointer.byteLength < 2 ||
      pointer.byteLength > MAX_ARTIFACT_BYTES
    ) {
      fail('HANDOFF_SIZE_INVALID', `byteLength must be between 2 and ${MAX_ARTIFACT_BYTES}.`);
    }
  } else if (pointer.rawSha256 !== undefined || pointer.byteLength !== undefined) {
    fail(
      'HANDOFF_POINTER_FIELD_FORBIDDEN',
      'Schema 2.0 pointers must let GitHub calculate rawSha256 and byteLength.',
    );
  }
  const expected = expectedFileName(pointer.artifactKind, pointer.targetAsOfDate);
  if (pointer.fileName !== expected || basename(pointer.fileName) !== pointer.fileName) {
    fail('HANDOFF_FILE_NAME_INVALID', `fileName must be ${expected}.`);
  }
  return pointer;
}

export function assertTrustedHandoffIssue(issue) {
  if (!isRecord(issue) || issue.pull_request) {
    fail('HANDOFF_ISSUE_INVALID', 'Handoff input must be a GitHub issue, not a pull request.');
  }
  if (!TRUSTED_AUTHOR_ASSOCIATIONS.has(String(issue.author_association || ''))) {
    fail('HANDOFF_AUTHOR_UNTRUSTED', 'Handoff issue author is not a trusted repository member.');
  }
  if (!labelsFor(issue).has(HANDOFF_LABEL)) {
    fail('HANDOFF_LABEL_MISSING', `Handoff issue must have the ${HANDOFF_LABEL} label.`);
  }
  return parseHandoffPointer(issue.body);
}

export function resolveHandoffIssues(
  issues,
  targetAsOfDate,
  schemaVersion = HANDOFF_SCHEMA_VERSION,
) {
  const candidates = [];
  const rejectedIssueNumbers = [];
  for (const issue of issues) {
    if (issue.pull_request || !labelsFor(issue).has(HANDOFF_LABEL)) continue;
    if (!TRUSTED_AUTHOR_ASSOCIATIONS.has(String(issue.author_association || ''))) continue;
    let pointer;
    try {
      pointer = parseHandoffPointer(issue.body);
    } catch {
      rejectedIssueNumbers.push(issue.number);
      continue;
    }
    if (pointer.targetAsOfDate !== targetAsOfDate || pointer.schemaVersion !== schemaVersion)
      continue;
    candidates.push({ issue, pointer });
  }

  const selected = [];
  const missingArtifactKinds = [];
  for (const artifactKind of requiredArtifactKinds(schemaVersion)) {
    const matches = candidates.filter((entry) => entry.pointer.artifactKind === artifactKind);
    if (!matches.length) {
      missingArtifactKinds.push(artifactKind);
      continue;
    }
    const highestAttempt = Math.max(...matches.map((entry) => entry.pointer.attempt));
    const newestAttempt = matches.filter((entry) => entry.pointer.attempt === highestAttempt);
    const identities = new Set(
      newestAttempt.map(
        (entry) =>
          `${entry.pointer.blobSha}:${entry.pointer.rawSha256}:${entry.pointer.byteLength}`,
      ),
    );
    if (identities.size !== 1) {
      fail(
        'HANDOFF_DUPLICATE_CONFLICT',
        `Conflicting ${artifactKind} pointers exist for attempt ${highestAttempt}.`,
        { issueNumbers: newestAttempt.map((entry) => entry.issue.number) },
      );
    }
    newestAttempt.sort((left, right) => Number(right.issue.number) - Number(left.issue.number));
    selected.push(newestAttempt[0]);
  }
  const selectedIssueNumbers = new Set(selected.map((entry) => Number(entry.issue.number)));
  const selectedAttempts = new Map(
    selected.map((entry) => [entry.pointer.artifactKind, Number(entry.pointer.attempt)]),
  );
  const supersededIssueNumbers = candidates
    .filter(
      (entry) =>
        !selectedIssueNumbers.has(Number(entry.issue.number)) &&
        Number(entry.pointer.attempt) <=
          Number(selectedAttempts.get(entry.pointer.artifactKind) || Number.NEGATIVE_INFINITY),
    )
    .map((entry) => Number(entry.issue.number))
    .sort((left, right) => left - right);
  return {
    status: missingArtifactKinds.length ? 'WAITING' : 'READY',
    schemaVersion,
    targetAsOfDate,
    selected,
    supersededIssueNumbers,
    missingArtifactKinds,
    rejectedIssueNumbers,
  };
}

function parseArgs(argv) {
  const [command, ...tokens] = argv;
  const args = { command };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) fail('HANDOFF_ARGUMENT_INVALID', `Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/gu, (_, value) => value.toUpperCase());
    const value = tokens[index + 1];
    if (!value || value.startsWith('--')) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function githubHeaders(token) {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': '2022-11-28',
    'user-agent': 'careerground-v5-handoff',
  };
}

async function githubRequest(path, { token, method = 'GET', body } = {}) {
  const response = await globalThis.fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      ...githubHeaders(token),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    fail('HANDOFF_GITHUB_API_FAILED', `GitHub API ${method} ${path} returned ${response.status}.`, {
      status: response.status,
    });
  }
  return response.status === 204 ? null : response.json();
}

async function listOpenHandoffIssues(repository, token) {
  const collected = [];
  for (let page = 1; page <= 10; page += 1) {
    const query = new URLSearchParams({
      state: 'open',
      labels: HANDOFF_LABEL,
      per_page: '100',
      page: String(page),
    });
    const entries = await githubRequest(`/repos/${repository}/issues?${query}`, { token });
    collected.push(...entries);
    if (entries.length < 100) return collected;
  }
  fail('HANDOFF_ISSUE_PAGE_LIMIT', 'More than 1,000 open handoff issues require cleanup.');
}

async function downloadBlob(repository, token, pointer) {
  const blob = await githubRequest(`/repos/${repository}/git/blobs/${pointer.blobSha}`, { token });
  if (blob?.encoding !== 'base64' || typeof blob.content !== 'string') {
    fail('HANDOFF_BLOB_ENCODING_INVALID', `${pointer.artifactKind} blob is not base64 encoded.`);
  }
  const bytes = Buffer.from(blob.content.replace(/\s/gu, ''), 'base64');
  if (bytes.byteLength < 2 || bytes.byteLength > MAX_ARTIFACT_BYTES) {
    fail('HANDOFF_SIZE_INVALID', `${pointer.artifactKind} blob size is outside the safe limit.`);
  }
  const computedRawSha256 = rawSha256(bytes);
  if (pointer.byteLength !== undefined && bytes.byteLength !== pointer.byteLength) {
    fail('HANDOFF_BLOB_SIZE_MISMATCH', `${pointer.artifactKind} byteLength does not match.`);
  }
  if (pointer.rawSha256 !== undefined && computedRawSha256 !== pointer.rawSha256) {
    fail('HANDOFF_BLOB_HASH_MISMATCH', `${pointer.artifactKind} raw SHA-256 does not match.`);
  }
  try {
    JSON.parse(bytes.toString('utf8'));
  } catch {
    fail('HANDOFF_BLOB_JSON_INVALID', `${pointer.artifactKind} blob is not valid UTF-8 JSON.`);
  }
  return { bytes, rawSha256: computedRawSha256, byteLength: bytes.byteLength };
}

function appendGithubOutput(path, report) {
  if (!path) return;
  const lines = [
    `status=${report.status}`,
    `handoff_schema_version=${report.schemaVersion}`,
    `target_as_of_date=${report.targetAsOfDate}`,
    `handoff_attempt=${Number(report.attempt || 0)}`,
    `issue_numbers=${report.issueNumbers.join(',')}`,
  ];
  writeFileSync(path, `${lines.join('\n')}\n`, { flag: 'a' });
}

export async function fetchHandoffBundle({ repository, token, triggerIssueNumber, output }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository)) {
    fail('HANDOFF_REPOSITORY_INVALID', 'GITHUB_REPOSITORY must be owner/name.');
  }
  const trigger = await githubRequest(`/repos/${repository}/issues/${triggerIssueNumber}`, {
    token,
  });
  const triggerPointer = assertTrustedHandoffIssue(trigger);
  if (labelsFor(trigger).has(PROCESSED_LABEL)) {
    return {
      schemaVersion: triggerPointer.schemaVersion,
      workflowId: HANDOFF_WORKFLOW_ID,
      status: 'ALREADY_PROCESSED',
      targetAsOfDate: triggerPointer.targetAsOfDate,
      issueNumbers: [Number(trigger.number)],
      supersededIssueNumbers: [],
      missingArtifactKinds: [],
      rejectedIssueNumbers: [],
      artifacts: [],
    };
  }
  const issues = await listOpenHandoffIssues(repository, token);
  const resolved = resolveHandoffIssues(
    issues,
    triggerPointer.targetAsOfDate,
    triggerPointer.schemaVersion,
  );
  const outputDirectory = resolve(output);
  mkdirSync(outputDirectory, { recursive: true });
  const report = {
    schemaVersion: triggerPointer.schemaVersion,
    workflowId: HANDOFF_WORKFLOW_ID,
    status: resolved.status,
    targetAsOfDate: resolved.targetAsOfDate,
    attempt: resolved.selected.length
      ? Math.max(...resolved.selected.map((entry) => Number(entry.pointer.attempt)))
      : 0,
    issueNumbers: resolved.selected.map((entry) => Number(entry.issue.number)),
    supersededIssueNumbers: resolved.supersededIssueNumbers,
    missingArtifactKinds: resolved.missingArtifactKinds,
    rejectedIssueNumbers: resolved.rejectedIssueNumbers,
    artifacts: resolved.selected.map(({ pointer }) => ({
      artifactKind: pointer.artifactKind,
      attempt: pointer.attempt,
      fileName: pointer.fileName,
      blobSha: pointer.blobSha,
      rawSha256: pointer.rawSha256 || null,
      byteLength: pointer.byteLength || null,
    })),
  };
  if (resolved.status === 'READY') {
    for (const [index, { pointer }] of resolved.selected.entries()) {
      const downloaded = await downloadBlob(repository, token, pointer);
      writeFileSync(resolve(outputDirectory, pointer.fileName), downloaded.bytes);
      report.artifacts[index].rawSha256 = downloaded.rawSha256;
      report.artifacts[index].byteLength = downloaded.byteLength;
    }
  }
  writeFileSync(
    resolve(outputDirectory, 'handoff-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return report;
}

async function markProcessed({ repository, token, reportPath }) {
  const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
  if (report.status !== 'READY' || !Array.isArray(report.issueNumbers)) {
    fail('HANDOFF_REPORT_NOT_READY', 'Only a READY handoff report can be marked processed.');
  }
  try {
    await githubRequest(`/repos/${repository}/labels`, {
      token,
      method: 'POST',
      body: {
        name: PROCESSED_LABEL,
        color: '1f883d',
        description: 'Validated by the CareerGround v5 artifact handoff workflow',
      },
    });
  } catch (error) {
    if (error?.code !== 'HANDOFF_GITHUB_API_FAILED' || error?.details?.status !== 422) throw error;
  }
  const issueNumbers = [
    ...new Set([
      ...report.issueNumbers.map(Number),
      ...(Array.isArray(report.supersededIssueNumbers)
        ? report.supersededIssueNumbers.map(Number)
        : []),
    ]),
  ];
  for (const issueNumber of issueNumbers) {
    await githubRequest(`/repos/${repository}/issues/${issueNumber}/labels`, {
      token,
      method: 'POST',
      body: { labels: [PROCESSED_LABEL] },
    });
    await githubRequest(`/repos/${repository}/issues/${issueNumber}`, {
      token,
      method: 'PATCH',
      body: processedIssueUpdate(),
    });
  }
  return { status: 'PROCESSED', issueNumbers };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const repository = String(args.repository || process.env.GITHUB_REPOSITORY || '');
  const token = String(process.env.GITHUB_TOKEN || '');
  if (!token) fail('HANDOFF_TOKEN_MISSING', 'GITHUB_TOKEN is required.');
  if (args.command === 'fetch') {
    const triggerIssueNumber = Number(args.issueNumber || process.env.GITHUB_EVENT_ISSUE_NUMBER);
    if (!Number.isInteger(triggerIssueNumber) || triggerIssueNumber < 1) {
      fail('HANDOFF_ISSUE_NUMBER_INVALID', 'A positive --issue-number is required.');
    }
    if (!args.output) fail('HANDOFF_OUTPUT_MISSING', '--output is required.');
    const report = await fetchHandoffBundle({
      repository,
      token,
      triggerIssueNumber,
      output: args.output,
    });
    appendGithubOutput(args.githubOutput, report);
    return report;
  }
  if (args.command === 'mark-processed') {
    if (!args.report) fail('HANDOFF_REPORT_MISSING', '--report is required.');
    return markProcessed({ repository, token, reportPath: args.report });
  }
  fail('HANDOFF_COMMAND_INVALID', 'Use fetch or mark-processed.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(
        `${JSON.stringify({ status: 'FAILED', code: error.code || 'HANDOFF_FAILED', message: error.message, details: error.details || null }, null, 2)}\n`,
      );
      process.exitCode = 1;
    });
}
