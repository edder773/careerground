import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { canonicalSha256, normalizeDownloadDisplayName, rawSha256 } from './canonical-json.mjs';
import {
  PARTITION_IDS,
  SCHEMA_VERSION,
  V5Error,
  WORKFLOW_ID,
  assertIsoTimestamp,
} from './contracts.mjs';

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim())
    throw new V5Error('PARTITION_SCHEMA_INVALID', `${field} is required.`, 'FAILED_INPUT');
}

export function validatePartitionResult(result, identity, expectedPartitionId) {
  if (!result || typeof result !== 'object' || Array.isArray(result))
    throw new V5Error('PARTITION_SCHEMA_INVALID', 'Partition JSON must be an object.');
  for (const field of ['runId', 'runGroupKey', 'targetAsOfDate']) {
    if (result[field] !== identity[field])
      throw new V5Error(
        'PARTITION_IDENTITY_MISMATCH',
        `${field} does not match the run manifest.`,
        'FAILED_PARTITION',
      );
  }
  if (result.workflowId !== WORKFLOW_ID || result.workflowId !== identity.workflowId)
    throw new V5Error('PARTITION_WORKFLOW_MISMATCH', 'workflowId mismatch.', 'FAILED_PARTITION');
  if (result.schemaVersion !== SCHEMA_VERSION || result.schemaVersion !== identity.schemaVersion)
    throw new V5Error(
      'PARTITION_SCHEMA_VERSION_MISMATCH',
      'schemaVersion mismatch.',
      'FAILED_PARTITION',
    );
  if (!PARTITION_IDS.includes(result.partitionId) || result.partitionId !== expectedPartitionId)
    throw new V5Error(
      'PARTITION_ID_MISMATCH',
      'partitionId must come from JSON metadata, not the filename.',
      'FAILED_PARTITION',
    );
  if (result.status !== 'SUCCESS')
    throw new V5Error(
      'PARTITION_REPORTED_FAILURE',
      `Partition ${result.partitionId} did not succeed.`,
      'FAILED_PARTITION',
    );
  if (!Array.isArray(result.sources) || !Array.isArray(result.items))
    throw new V5Error('PARTITION_SCHEMA_INVALID', 'sources and items must be arrays.');
  if (result.rowCount !== result.items.length)
    throw new V5Error(
      'PARTITION_ROW_COUNT_MISMATCH',
      `Partition ${result.partitionId} rowCount mismatch.`,
      'FAILED_PARTITION',
    );
  assertIsoTimestamp(result.startedAt, 'partition.startedAt');
  assertIsoTimestamp(result.completedAt, 'partition.completedAt');
  assertIsoTimestamp(result.exportedAt, 'partition.exportedAt');
  result.items.forEach((item, index) => {
    for (const field of [
      'id',
      'canonicalJobKey',
      'fingerprint',
      'sourceUrl',
      'sourceName',
      'companyName',
      'title',
      'category',
      'careerScope',
      'status',
      'lastVerifiedAt',
    ])
      requireText(item?.[field], `items[${index}].${field}`);
    if (!Array.isArray(item.techStack))
      throw new V5Error('PARTITION_SCHEMA_INVALID', `items[${index}].techStack must be an array.`);
    try {
      const url = new URL(item.sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
    } catch {
      throw new V5Error('PARTITION_SCHEMA_INVALID', `items[${index}].sourceUrl must be HTTP(S).`);
    }
  });
  return result;
}

export function loadExplicitPartition({ path, partitionId, identity, expectedHashes }) {
  if (!PARTITION_IDS.includes(partitionId))
    throw new V5Error('INVALID_PARTITION_ID', 'An explicit partitionId is required.');
  const absolutePath = resolve(path);
  let raw;
  try {
    raw = readFileSync(absolutePath);
  } catch (error) {
    throw new V5Error(
      'PARTITION_FILE_MISSING',
      `Cannot read explicit partition artifact: ${absolutePath}`,
      'FAILED_COLLECTION',
      { cause: String(error) },
    );
  }
  let result;
  try {
    result = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new V5Error(
      'PARTITION_JSON_INVALID',
      `Partition ${partitionId} is not valid JSON.`,
      'FAILED_INPUT',
    );
  }
  validatePartitionResult(result, identity, partitionId);
  const hashes = { rawSha256: rawSha256(raw), canonicalSha256: canonicalSha256(result) };
  if (expectedHashes?.rawSha256 && hashes.rawSha256 !== expectedHashes.rawSha256)
    throw new V5Error(
      'PARTITION_RAW_HASH_MISMATCH',
      `Partition ${partitionId} raw SHA-256 mismatch.`,
      'FAILED_PARTITION',
    );
  if (expectedHashes?.canonicalSha256 && hashes.canonicalSha256 !== expectedHashes.canonicalSha256)
    throw new V5Error(
      'PARTITION_CANONICAL_HASH_MISMATCH',
      `Partition ${partitionId} canonical SHA-256 mismatch.`,
      'FAILED_PARTITION',
    );
  return {
    result,
    descriptor: {
      partitionId,
      status: 'SUCCESS',
      sources: [...result.sources].sort(),
      rowCount: result.rowCount,
      rawSha256: hashes.rawSha256,
      canonicalSha256: hashes.canonicalSha256,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      artifactPath: absolutePath,
      displayName: normalizeDownloadDisplayName(basename(path)),
    },
  };
}

export function loadDeprecatedLibraryArtifact(options) {
  process.emitWarning(
    'Library filename selection is deprecated and will be removed after v5 cutover.',
    { code: 'CAREERGROUND_LIBRARY_ADAPTER_DEPRECATED' },
  );
  if (!options?.path || !options?.partitionId || !options?.identity || !options?.expectedHashes) {
    throw new V5Error(
      'DEPRECATED_ADAPTER_REQUIRES_MANIFEST',
      'The Library adapter requires an explicit path, partitionId, identity, and both hashes.',
    );
  }
  return loadExplicitPartition(options);
}
