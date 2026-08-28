import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import process from 'node:process';
import {
  PARTITION_IDS,
  RUN_STATUSES,
  V5Error,
  assertExecutionIdentity,
  assertIsoTimestamp,
} from './contracts.mjs';
import { canonicalSha256 } from './canonical-json.mjs';

const HASH = /^[a-f0-9]{64}$/;

export function validatePartitionDescriptor(partition) {
  if (!partition || typeof partition !== 'object')
    throw new V5Error('INVALID_PARTITION', 'Partition descriptor is required.');
  if (!PARTITION_IDS.includes(partition.partitionId))
    throw new V5Error('INVALID_PARTITION_ID', 'partitionId must be 1, 2, or 3.');
  if (!['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'].includes(partition.status))
    throw new V5Error('INVALID_PARTITION_STATUS', 'Invalid partition status.');
  if (
    !Array.isArray(partition.sources) ||
    partition.sources.some((value) => typeof value !== 'string' || !value.trim())
  ) {
    throw new V5Error('INVALID_PARTITION_SOURCES', 'Partition sources must be non-empty strings.');
  }
  if (!Number.isInteger(partition.rowCount) || partition.rowCount < 0)
    throw new V5Error('INVALID_ROW_COUNT', 'rowCount must be non-negative.');
  if (!HASH.test(String(partition.rawSha256)) || !HASH.test(String(partition.canonicalSha256))) {
    throw new V5Error('INVALID_HASH', 'Partition hashes must be lowercase SHA-256 values.');
  }
  assertIsoTimestamp(partition.startedAt, 'partition.startedAt');
  assertIsoTimestamp(partition.completedAt, 'partition.completedAt');
  if (typeof partition.artifactPath !== 'string' || !partition.artifactPath)
    throw new V5Error('INVALID_ARTIFACT_PATH', 'artifactPath is required.');
  return partition;
}

export function validateManifest(manifest) {
  assertExecutionIdentity(manifest);
  if (!Array.isArray(manifest.partitions) || manifest.partitions.length !== 3) {
    throw new V5Error('PARTITION_COUNT_MISMATCH', 'Manifest must contain three partitions.');
  }
  manifest.partitions.forEach(validatePartitionDescriptor);
  const ids = manifest.partitions.map(({ partitionId }) => partitionId);
  if (new Set(ids).size !== 3 || PARTITION_IDS.some((id) => !ids.includes(id))) {
    throw new V5Error(
      'PARTITION_SET_MISMATCH',
      'Manifest must contain partition 1, 2, and 3 exactly once.',
    );
  }
  for (const field of [
    'merge',
    'deduplication',
    'validation',
    'counts',
    'qualityGate',
    'db',
    'notification',
  ]) {
    if (!manifest[field] || typeof manifest[field] !== 'object' || Array.isArray(manifest[field])) {
      throw new V5Error('MANIFEST_FIELD_MISSING', `Manifest field ${field} is required.`);
    }
  }
  for (const field of ['createdAt', 'validatedAt', 'publishedAt']) {
    assertIsoTimestamp(manifest[field], field, field !== 'createdAt');
  }
  if (!RUN_STATUSES.includes(manifest.status))
    throw new V5Error('INVALID_STATUS', 'Invalid manifest status.');
  if (!/^[a-f0-9]{64}$/.test(String(manifest.manifestChecksum))) {
    throw new V5Error('INVALID_MANIFEST_HASH', 'manifestChecksum must be SHA-256.');
  }
  return manifest;
}

export function manifestChecksum(manifest) {
  const value = { ...manifest };
  delete value.manifestChecksum;
  return canonicalSha256(value);
}

export function assertManifestChecksum(manifest) {
  if (manifest.manifestChecksum !== manifestChecksum(manifest)) {
    throw new V5Error('MANIFEST_HASH_MISMATCH', 'Manifest canonical SHA-256 does not match.');
  }
  return manifest;
}

export function withManifestChecksum(manifest) {
  return { ...manifest, manifestChecksum: manifestChecksum(manifest) };
}

export function updatePointerAtomically(directory, name, pointer, manifest) {
  if (name === 'last-success' && manifest.status !== 'PUBLISHED') {
    throw new V5Error(
      'LAST_SUCCESS_REQUIRES_PUBLISHED',
      'last-success can only reference PUBLISHED runs.',
    );
  }
  mkdirSync(directory, { recursive: true });
  const target = join(directory, `${name}.json`);
  const temporary = join(dirname(target), `.${name}.${process.pid}.tmp`);
  writeFileSync(temporary, `${JSON.stringify(pointer, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(temporary, target);
  return target;
}

export function readPointer(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
