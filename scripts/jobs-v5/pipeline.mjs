import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { canonicalSha256, canonicalizeHttpUrl } from './canonical-json.mjs';
import { V5Error, assertExecutionIdentity, transition } from './contracts.mjs';
import { loadExplicitPartition } from './adapter.mjs';
import { businessDayDecision, resolveHolidayCache } from './holiday-cache.mjs';
import { withManifestChecksum } from './manifest.mjs';

export async function preflight(
  identity,
  { holidayCache, now = new Date(), refreshHolidayCache, force = false } = {},
) {
  assertExecutionIdentity(identity);
  const resolved = await resolveHolidayCache(holidayCache, { now, refresh: refreshHolidayCache });
  const decision = businessDayDecision(identity.targetAsOfDate, resolved.cache);
  if (!force && decision.status !== 'RUNNING')
    return {
      identity: transition(identity, decision.status),
      holiday: { ...decision, cacheSource: resolved.source, warning: resolved.warning },
    };
  return {
    identity: transition(identity, 'RUNNING'),
    holiday: { status: 'RUNNING', cacheSource: resolved.source, warning: resolved.warning },
  };
}

export function collect(identity, inputs) {
  if (identity.status !== 'RUNNING')
    throw new V5Error(
      'COLLECT_REQUIRES_RUNNING',
      'collect requires a RUNNING execution.',
      'FAILED_COLLECTION',
    );
  if (!Array.isArray(inputs) || inputs.length !== 3)
    throw new V5Error(
      'PARTITION_INPUT_COUNT',
      'Exactly three explicit partition inputs are required.',
      'FAILED_COLLECTION',
    );
  const ids = inputs.map(({ partitionId }) => partitionId);
  if (new Set(ids).size !== 3)
    throw new V5Error('DUPLICATE_PARTITION', 'Duplicate partitionId.', 'FAILED_PARTITION');
  return inputs.map((input) => loadExplicitPartition({ ...input, identity }));
}

function sameIdentity(result, identity) {
  for (const field of ['schemaVersion', 'workflowId', 'runId', 'runGroupKey', 'targetAsOfDate']) {
    if (result[field] !== identity[field])
      throw new V5Error(
        'PARTITION_MIXED_RUN',
        `${field} differs across partitions.`,
        'FAILED_MERGE',
      );
  }
}

export function merge(identity, loadedPartitions) {
  if (!Array.isArray(loadedPartitions) || loadedPartitions.length !== 3)
    throw new V5Error('PARTITION_MISSING', 'All three partitions are required.', 'FAILED_MERGE');
  const seenIds = new Set();
  const items = [];
  const byCanonical = new Map();
  const sourceUrls = new Map();
  const fingerprints = new Map();
  const ids = new Map();
  let removedDuplicates = 0;
  for (const loaded of loadedPartitions) {
    const result = loaded.result;
    sameIdentity(result, identity);
    if (seenIds.has(result.partitionId))
      throw new V5Error('DUPLICATE_PARTITION', 'Duplicate partitionId.', 'FAILED_MERGE');
    seenIds.add(result.partitionId);
    if (loaded.descriptor.rowCount !== result.items.length)
      throw new V5Error(
        'PARTITION_ROW_COUNT_MISMATCH',
        'Descriptor rowCount mismatch.',
        'FAILED_MERGE',
      );
    for (const item of result.items) {
      for (const [map, value, label] of [
        [ids, item.id, 'id'],
        [sourceUrls, canonicalizeHttpUrl(item.sourceUrl), 'sourceUrl'],
        [fingerprints, item.fingerprint, 'fingerprint'],
      ]) {
        const owner = map.get(value);
        if (owner && owner !== item.canonicalJobKey)
          throw new V5Error(
            'CROSS_PARTITION_DUPLICATE_CONFLICT',
            `${label} belongs to two canonical jobs.`,
            'FAILED_MERGE',
          );
        map.set(value, item.canonicalJobKey);
      }
      const previous = byCanonical.get(item.canonicalJobKey);
      if (previous) {
        if (canonicalSha256(previous) !== canonicalSha256(item))
          throw new V5Error(
            'CROSS_PARTITION_DUPLICATE_CONFLICT',
            'Duplicate canonicalJobKey has different content.',
            'FAILED_MERGE',
          );
        removedDuplicates += 1;
      } else {
        byCanonical.set(item.canonicalJobKey, item);
        items.push(item);
      }
    }
  }
  if ([1, 2, 3].some((id) => !seenIds.has(id)))
    throw new V5Error('PARTITION_MISSING', 'Partition 1, 2, and 3 are required.', 'FAILED_MERGE');
  items.sort((left, right) => left.canonicalJobKey.localeCompare(right.canonicalJobKey));
  return {
    items,
    rowCount: items.length,
    inputRowCount: loadedPartitions.reduce((sum, entry) => sum + entry.result.rowCount, 0),
    removedDuplicates,
    canonicalSha256: canonicalSha256(items),
  };
}

const REQUIRED_JOB_FIELDS = [
  'id',
  'canonicalJobKey',
  'fingerprint',
  'sourceUrl',
  'sourceName',
  'companyName',
  'title',
  'category',
  'careerScope',
  'careerEvidence',
  'status',
  'lastVerifiedAt',
];
const MUTABLE_FIELDS = [
  'status',
  'deadlineAt',
  'rolling',
  'summary',
  'lastVerifiedAt',
  'updatedAt',
];

function jobErrors(job, policy, targetAsOfDate) {
  const errors = [];
  for (const field of REQUIRED_JOB_FIELDS)
    if (!String(job[field] ?? '').trim()) errors.push(`missing:${field}`);
  if (job.status === 'ACTIVE' && !policy.allowedCareerScopes.includes(job.careerScope))
    errors.push('career-scope');
  if (job.status === 'ACTIVE' && !job.careerEvidence.trim()) errors.push('career-evidence');
  if (job.status === 'ACTIVE' && job.deadlineAt && job.deadlineAt.slice(0, 10) < targetAsOfDate)
    errors.push('expired-active');
  if (policy.excludedCategories.includes(job.category)) errors.push('excluded-category');
  return errors;
}

export function validateAndPlan(identity, loadedPartitions, merged, baselineItems, policy) {
  if (!Array.isArray(baselineItems))
    throw new V5Error(
      'BASELINE_MISSING',
      'An explicit baseline array is required.',
      'FAILED_VALIDATION',
    );
  const quarantineReasons = [];
  for (const loaded of loadedPartitions)
    if (loaded.result.rowCount < policy.minimumRowsPerPartition)
      quarantineReasons.push(`PARTITION_${loaded.result.partitionId}_BELOW_MINIMUM`);
  const baselineByKey = new Map(
    baselineItems.map((job) => [job.canonicalJobKey || job.canonicalKey, job]),
  );
  const newJobs = [];
  const updates = [];
  const ended = [];
  const excluded = [];
  let invalidCount = 0;
  for (const job of merged.items) {
    const errors = jobErrors(job, policy, identity.targetAsOfDate);
    if (errors.length) {
      invalidCount += 1;
      excluded.push({ id: job.id, canonicalJobKey: job.canonicalJobKey, reasons: errors });
      continue;
    }
    const existing = baselineByKey.get(job.canonicalJobKey);
    if (!existing) {
      if (!policy.allowedNewStatuses.includes(job.status))
        excluded.push({
          id: job.id,
          canonicalJobKey: job.canonicalJobKey,
          reasons: ['new-non-active'],
        });
      else newJobs.push(job);
      continue;
    }
    const changes = Object.fromEntries(
      MUTABLE_FIELDS.filter((field) => (existing[field] ?? null) !== (job[field] ?? null)).map(
        (field) => [field, { before: existing[field] ?? null, after: job[field] ?? null }],
      ),
    );
    if (Object.keys(changes).length) {
      const planned = {
        id: existing.id,
        sourceUrl: existing.sourceUrl,
        canonicalJobKey: job.canonicalJobKey,
        changes,
      };
      if (['EXPIRED', 'REMOVED'].includes(job.status)) ended.push(planned);
      else updates.push(planned);
    }
  }
  const baselineActive = baselineItems.filter((item) => item.status === 'ACTIVE').length;
  const activeCount = merged.items.filter((item) => item.status === 'ACTIVE').length;
  const dropRatio = baselineActive
    ? Math.max(0, (baselineActive - activeCount) / baselineActive)
    : 0;
  if (dropRatio > policy.maximumActiveDropRatio) quarantineReasons.push('ACTIVE_COUNT_DROP');
  const endRatio = baselineActive ? ended.length / baselineActive : 0;
  if (ended.length > policy.maximumEndCount || endRatio > policy.maximumEndRatio)
    quarantineReasons.push('MASS_END');
  const changedFieldCount = [...updates, ...ended].reduce(
    (sum, item) => sum + Object.keys(item.changes).length,
    0,
  );
  if (changedFieldCount > policy.maximumChangedFieldCount)
    quarantineReasons.push('MASS_FIELD_CHANGE');
  const domainChanges = merged.items.filter((job) => {
    const existing = baselineByKey.get(job.canonicalJobKey);
    if (!existing?.sourceUrl || existing.sourceUrl === job.sourceUrl) return false;
    return (
      new URL(existing.sourceUrl).hostname.toLowerCase() !==
      new URL(job.sourceUrl).hostname.toLowerCase()
    );
  }).length;
  if (domainChanges > policy.maximumApplicationDomainChangeCount)
    quarantineReasons.push('MASS_DOMAIN_CHANGE');
  const countSources = (items) => {
    const counts = new Map();
    for (const item of items) counts.set(item.sourceName, (counts.get(item.sourceName) || 0) + 1);
    return counts;
  };
  const baselineSources = countSources(baselineItems);
  const mergedSources = countSources(merged.items);
  for (const [sourceName, previousCount] of baselineSources) {
    if (previousCount < 2) continue;
    const sourceDropRatio = Math.max(
      0,
      (previousCount - (mergedSources.get(sourceName) || 0)) / previousCount,
    );
    if (sourceDropRatio > policy.maximumSourceDropRatio)
      quarantineReasons.push(`SOURCE_DROP:${sourceName}`);
  }
  if (invalidCount) quarantineReasons.push('INVALID_JOB_POLICY');
  const counts = {
    new: newJobs.length,
    changed: updates.length,
    ended: ended.length,
    excluded: excluded.length,
    active: activeCount,
  };
  const changeCount = counts.new + counts.changed + counts.ended;
  const resultStatus = changeCount ? 'SUCCESS_WITH_CHANGES' : 'SUCCESS_NO_CHANGES';
  let progressed = transition(identity, resultStatus);
  const qualityGate = {
    status: quarantineReasons.length ? 'QUARANTINED' : 'PASS',
    reasons: [...new Set(quarantineReasons)],
    metrics: { baselineActive, activeCount, dropRatio, endRatio, changedFieldCount, domainChanges },
  };
  if (quarantineReasons.length)
    progressed = transition(progressed, 'QUARANTINED', {
      errorCode: 'QUALITY_GATE_FAILED',
      errorMessage: qualityGate.reasons.join(', '),
    });
  else progressed = transition(progressed, 'VERIFIED');
  const verifiedAt = new Date().toISOString();
  progressed = { ...progressed, completedAt: verifiedAt };
  const baseManifest = {
    ...progressed,
    baseline: { rowCount: baselineItems.length, canonicalSha256: canonicalSha256(baselineItems) },
    partitions: loadedPartitions.map(({ descriptor }) => descriptor),
    merge: {
      status: 'SUCCESS',
      rowCount: merged.rowCount,
      canonicalSha256: merged.canonicalSha256,
    },
    deduplication: {
      inputRowCount: merged.inputRowCount,
      outputRowCount: merged.rowCount,
      removedCount: merged.removedDuplicates,
    },
    validation: { status: quarantineReasons.length ? 'QUARANTINED' : 'PASS', invalidCount },
    resultStatus,
    counts,
    qualityGate,
    quarantineReasons: qualityGate.reasons,
    db: {
      status: 'NOT_STARTED',
      idempotencyKey: `publish:${identity.workflowId}:${identity.runId}`,
    },
    notification: { status: 'NOT_STARTED', retryPending: false },
    createdAt: identity.startedAt,
    validatedAt: verifiedAt,
    publishedAt: null,
  };
  const manifest = withManifestChecksum(baseManifest);
  return {
    manifest,
    verified: {
      schemaVersion: identity.schemaVersion,
      workflowId: identity.workflowId,
      runId: identity.runId,
      runGroupKey: identity.runGroupKey,
      targetAsOfDate: identity.targetAsOfDate,
      status: progressed.status,
      counts,
      newJobs,
      updates,
      ended,
      excluded,
      verifiedAt,
      manifestChecksum: manifest.manifestChecksum,
    },
  };
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
