#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL, URL } from 'node:url';

const WORKFLOW_ID = 'CG-JOBS-PROD-V5';
const ARTIFACT_TYPE = 'CAREERGROUND_DISCOVERY_PUBLISH_REQUEST';

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) fail(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/gu, (_, value) => value.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) result[key] = true;
    else {
      result[key] = value;
      index += 1;
    }
  }
  return result;
}

const readJson = (path) => JSON.parse(readFileSync(resolve(path), 'utf8'));

export function buildPublishRequest({ handoff, report, partitions }) {
  if (handoff?.status !== 'READY' || handoff?.schemaVersion !== '2.0') {
    fail('A READY schema 2.0 handoff report is required.');
  }
  if (
    report?.status !== 'VERIFIED_DISCOVERY' ||
    report?.workflowId !== WORKFLOW_ID ||
    report?.targetAsOfDate !== handoff.targetAsOfDate
  ) {
    fail('The discovery report does not match its handoff.');
  }
  if (!Array.isArray(handoff.artifacts) || handoff.artifacts.length !== 3) {
    fail('The handoff must contain exactly three artifacts.');
  }
  const attempt = Math.max(...handoff.artifacts.map((artifact) => Number(artifact.attempt)));
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 99) {
    fail('The handoff attempt is invalid.');
  }
  const runId = `CG-${handoff.targetAsOfDate}-A${attempt}-discovery`;
  if (report.runId !== runId) fail('The discovery report runId is not deterministic.');
  return {
    schemaVersion: '5.1',
    artifactType: ARTIFACT_TYPE,
    workflowId: WORKFLOW_ID,
    runId,
    runGroupKey: `CG-${handoff.targetAsOfDate}`,
    targetAsOfDate: handoff.targetAsOfDate,
    attempt,
    report,
    partitions,
  };
}

export async function publishDiscovery({ endpoint, token, request, fetchImpl = globalThis.fetch }) {
  if (!token) fail('CAREERGROUND_PUBLISH_TOKEN is required.');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') fail('The production publish endpoint must use HTTPS.');
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
    signal: globalThis.AbortSignal.timeout(30_000),
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    // The HTTP status is sufficient for a secret-free error.
  }
  if (!response.ok) {
    const code = typeof body?.code === 'string' ? ` (${body.code})` : '';
    fail(`CareerGround production publish failed: HTTP ${response.status}${code}`);
  }
  if (!['PUBLISHED', 'ALREADY_PUBLISHED'].includes(body?.status)) {
    fail('CareerGround production publish returned an unexpected status.');
  }
  return body;
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  for (const field of ['handoff', 'report', 'partition1', 'partition2', 'partition3', 'output']) {
    if (!args[field]) fail(`--${field} is required.`);
  }
  const request = buildPublishRequest({
    handoff: readJson(args.handoff),
    report: readJson(args.report),
    partitions: [readJson(args.partition1), readJson(args.partition2), readJson(args.partition3)],
  });
  const receipt = await publishDiscovery({
    endpoint:
      env.CAREERGROUND_PUBLISH_URL ||
      'https://careerground-workspace.edder773.chatgpt.site/api/v1/internal/jobs-v5/publish',
    token: env.CAREERGROUND_PUBLISH_TOKEN,
    request,
  });
  const outputPath = resolve(args.output);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((receipt) => {
      process.stdout.write(
        `CareerGround discovery publish: ${receipt.status}, inserted=${Number(receipt.inserted || 0)}, skippedExisting=${Number(receipt.skippedExisting || 0)}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
