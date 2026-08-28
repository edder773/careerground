import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertExecutionIdentity, createExecutionIdentity, V5Error } from './contracts.mjs';
import { collect, merge, preflight, readJson, validateAndPlan } from './pipeline.mjs';
import { buildNotificationPreview } from './notify.mjs';

export async function orchestrate({
  targetAsOfDate,
  attempt = 1,
  mode = 'DRY_RUN',
  runId,
  previousSuccessfulRunId = null,
  partitionPaths,
  baselinePath,
  holidayCachePath,
  validationPolicyPath,
  force = false,
  outputDirectory,
}) {
  let identity = createExecutionIdentity({
    targetAsOfDate,
    attempt,
    mode,
    previousSuccessfulRunId,
    nonce: runId ? runId.split('-').at(-1) : undefined,
  });
  if (runId && identity.runId !== runId) {
    identity = assertExecutionIdentity({ ...identity, runId });
  }
  const preflightResult = await preflight(identity, {
    holidayCache: readJson(holidayCachePath),
    force,
  });
  if (preflightResult.identity.status !== 'RUNNING') {
    return { identity: preflightResult.identity, holiday: preflightResult.holiday, skipped: true };
  }
  const loadedPartitions = collect(
    preflightResult.identity,
    partitionPaths.map((path, index) => ({ path, partitionId: index + 1 })),
  );
  const merged = merge(preflightResult.identity, loadedPartitions);
  const result = validateAndPlan(
    preflightResult.identity,
    loadedPartitions,
    merged,
    readJson(baselinePath),
    readJson(validationPolicyPath),
  );
  const preview =
    result.manifest.status === 'VERIFIED'
      ? buildNotificationPreview(result.manifest, { dryRun: true })
      : null;
  const output = {
    identity: preflightResult.identity,
    holiday: preflightResult.holiday,
    loadedPartitions,
    merged,
    ...result,
    notificationPreview: preview,
    productionDatabaseChanged: false,
    slackSent: false,
  };
  if (outputDirectory) {
    const directory = resolve(outputDirectory);
    mkdirSync(directory, { recursive: true });
    writeFileSync(`${directory}/manifest.json`, `${JSON.stringify(result.manifest, null, 2)}\n`);
    writeFileSync(
      `${directory}/verified-result.json`,
      `${JSON.stringify(result.verified, null, 2)}\n`,
    );
    writeFileSync(
      `${directory}/notification-preview.json`,
      `${JSON.stringify(preview, null, 2)}\n`,
    );
    writeFileSync(
      `${directory}/summary.json`,
      `${JSON.stringify(
        {
          runId: result.manifest.runId,
          runGroupKey: result.manifest.runGroupKey,
          targetAsOfDate: result.manifest.targetAsOfDate,
          status: result.manifest.status,
          counts: result.manifest.counts,
          productionDatabaseChanged: false,
          slackSent: false,
        },
        null,
        2,
      )}\n`,
    );
  }
  return output;
}

export function failureResult(error, identity = null) {
  const known = error instanceof V5Error;
  return {
    status: known ? error.status : 'FAILED_INPUT',
    errorCode: known ? error.code : 'UNEXPECTED_ERROR',
    errorMessage: error instanceof Error ? error.message : String(error),
    runId: identity?.runId || null,
    productionDatabaseChanged: false,
    slackSent: false,
  };
}
