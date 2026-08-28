#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { assertManifestChecksum, validateManifest } from './manifest.mjs';
import { loadLegacyV4Bundle, writeLegacyV4Conversion } from './legacy-v4-adapter.mjs';
import { buildNotificationPreview } from './notify.mjs';
import { failureResult, orchestrate } from './orchestrate.mjs';
import { createExecutionIdentity } from './contracts.mjs';

function parseArgs(argv) {
  const [command = 'dry-run', ...tokens] = argv;
  const values = { command };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, value) => value.toUpperCase());
    const next = tokens[index + 1];
    if (!next || next.startsWith('--')) values[key] = true;
    else {
      values[key] = next;
      index += 1;
    }
  }
  return values;
}

const root = resolve(import.meta.dirname, '../..');
const fixture = (name) => resolve(import.meta.dirname, 'fixtures', name);

function readManifest(path) {
  const manifest = JSON.parse(readFileSync(resolve(path), 'utf8'));
  validateManifest(manifest);
  assertManifestChecksum(manifest);
  return manifest;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.command === 'adapt-v4') {
    for (const field of ['partition1', 'partition2', 'partition3', 'final', 'audit', 'output']) {
      if (!args[field])
        throw new Error(
          `adapt-v4 requires --${field.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}.`,
        );
    }
    if (!args.targetAsOfDate) throw new Error('adapt-v4 requires --target-as-of-date.');
    const identity = createExecutionIdentity({
      targetAsOfDate: String(args.targetAsOfDate),
      attempt: Number(args.attempt || 1),
      mode: String(args.mode || 'DRY_RUN'),
      nonce: args.runId ? String(args.runId).split('-').at(-1) : undefined,
    });
    const resolvedIdentity = args.runId ? { ...identity, runId: String(args.runId) } : identity;
    const bundle = loadLegacyV4Bundle({
      partitionPaths: [args.partition1, args.partition2, args.partition3],
      finalPath: args.final,
      auditPath: args.audit,
      identity: resolvedIdentity,
    });
    const reportPath = writeLegacyV4Conversion(args.output, bundle);
    return { ...bundle.report, reportPath };
  }
  if (args.command === 'notify') {
    if (!args.manifest) throw new Error('--manifest is required.');
    const manifest = readManifest(args.manifest);
    const preview = buildNotificationPreview(manifest, { dryRun: args.preview === true });
    return { status: 'PREVIEW_ONLY', slackSent: false, preview };
  }
  if (args.command === 'publish') {
    if (!args.manifest || !args.approvedRunId)
      throw new Error('publish requires --manifest and --approved-run-id.');
    const manifest = readManifest(args.manifest);
    if (manifest.runId !== args.approvedRunId || manifest.status !== 'VERIFIED')
      throw new Error('approvedRunId must identify this VERIFIED manifest.');
    return {
      status: 'MANUAL_REQUIRED',
      reason:
        'Production D1 binding and explicit approval are required. Use deployment/sites/d1-jobs-v5.ts through the approved deployment adapter.',
      productionDatabaseChanged: false,
      slackSent: false,
    };
  }
  if (!['preflight', 'collect', 'merge', 'validate', 'run', 'dry-run'].includes(args.command)) {
    throw new Error(`Unsupported v5 command: ${args.command}`);
  }
  const targetAsOfDate = String(args.targetAsOfDate || '2026-08-27');
  const output = await orchestrate({
    targetAsOfDate,
    attempt: Number(args.attempt || 1),
    mode: String(args.mode || 'DRY_RUN'),
    runId:
      args.runId || (targetAsOfDate === '2026-08-27' ? 'CG-2026-08-27-A1-fixture1' : undefined),
    previousSuccessfulRunId: args.previousSuccessfulRunId || null,
    partitionPaths: [
      args.partition1 || fixture('partition-1.json'),
      args.partition2 || fixture('partition-2.json'),
      args.partition3 || fixture('partition-3.json'),
    ],
    baselinePath: args.baseline || fixture('baseline.json'),
    holidayCachePath: args.holidayCache || resolve(root, 'config/careerground-holidays-2026.json'),
    validationPolicyPath:
      args.policy || resolve(root, 'config/careerground-validation-policy.json'),
    force: args.force === true,
    outputDirectory:
      args.output ||
      (args.command === 'dry-run' ? resolve(root, 'work/jobs-v5/dry-run') : undefined),
  });
  if (args.command === 'preflight')
    return { identity: output.identity, holiday: output.holiday, skipped: output.skipped || false };
  if (args.command === 'collect')
    return {
      status: output.manifest?.status || output.identity.status,
      partitions: output.loadedPartitions?.map(({ descriptor }) => descriptor) || [],
    };
  if (args.command === 'merge')
    return {
      status: output.manifest?.status || output.identity.status,
      merge: output.merged || null,
    };
  if (args.command === 'validate') return { manifest: output.manifest, verified: output.verified };
  return { manifest: output.manifest, productionDatabaseChanged: false, slackSent: false };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${JSON.stringify(failureResult(error), null, 2)}\n`);
      process.exitCode = 1;
    });
}
