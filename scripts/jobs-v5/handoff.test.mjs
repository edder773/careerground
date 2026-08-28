import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import {
  HANDOFF_LABEL,
  assertTrustedHandoffIssue,
  parseHandoffPointer,
  processedIssueUpdate,
  rawSha256,
  resolveHandoffIssues,
} from './handoff.mjs';

const date = '2026-08-28';

function pointer(artifactKind, overrides = {}, schemaVersion = '1.0') {
  const partition = artifactKind.startsWith('PARTITION_') ? artifactKind.at(-1) : null;
  const fileName = partition
    ? `careerground-partition-${partition}-${date}.json`
    : artifactKind === 'LEGACY_FINAL'
      ? `careerground-jobs-live-${date}-final.json`
      : `careerground-merge-audit-${date}.json`;
  const bytes = Buffer.from('{}\n');
  return {
    schemaVersion,
    workflowId: 'CG-JOBS-PROD-V5',
    targetAsOfDate: date,
    artifactKind,
    attempt: 1,
    blobSha: createHash('sha1').update(artifactKind).digest('hex'),
    ...(schemaVersion === '1.0'
      ? { rawSha256: rawSha256(bytes), byteLength: bytes.byteLength }
      : {}),
    fileName,
    ...overrides,
  };
}

function issue(number, artifactKind, overrides = {}, schemaVersion = '1.0') {
  const value = pointer(artifactKind, overrides.pointer, schemaVersion);
  return {
    number,
    body: `<!-- CAREERGROUND_V5_HANDOFF\n${JSON.stringify(value)}\n-->`,
    author_association: overrides.authorAssociation || 'OWNER',
    labels: overrides.labels || [{ name: HANDOFF_LABEL }],
  };
}

describe('CareerGround v5 GitHub artifact handoff', () => {
  it('parses the strict pointer contract and rejects extra fields', () => {
    expect(parseHandoffPointer(issue(1, 'PARTITION_1').body)).toMatchObject({
      artifactKind: 'PARTITION_1',
      targetAsOfDate: date,
    });
    expect(() =>
      parseHandoffPointer(issue(1, 'PARTITION_1', { pointer: { unexpectedSecret: 'no' } }).body),
    ).toThrow(expect.objectContaining({ code: 'HANDOFF_POINTER_FIELD_FORBIDDEN' }));
  });

  it('requires a trusted repository relationship and the handoff label', () => {
    expect(() =>
      assertTrustedHandoffIssue(issue(1, 'PARTITION_1', { authorAssociation: 'CONTRIBUTOR' })),
    ).toThrow(expect.objectContaining({ code: 'HANDOFF_AUTHOR_UNTRUSTED' }));
    expect(() => assertTrustedHandoffIssue(issue(1, 'PARTITION_1', { labels: [] }))).toThrow(
      expect.objectContaining({ code: 'HANDOFF_LABEL_MISSING' }),
    );
  });

  it('waits until all three partitions, final, and audit are present', () => {
    const result = resolveHandoffIssues(
      [issue(1, 'PARTITION_1'), issue(2, 'PARTITION_2')],
      date,
      '1.0',
    );
    expect(result.status).toBe('WAITING');
    expect(result.missingArtifactKinds).toEqual(['PARTITION_3', 'LEGACY_FINAL', 'LEGACY_AUDIT']);
  });

  it('selects the highest retry attempt and is ready only with one complete bundle', () => {
    const result = resolveHandoffIssues(
      [
        issue(1, 'PARTITION_1'),
        issue(2, 'PARTITION_1', { pointer: { attempt: 2 } }),
        issue(3, 'PARTITION_2'),
        issue(4, 'PARTITION_3'),
        issue(5, 'LEGACY_FINAL'),
        issue(6, 'LEGACY_AUDIT'),
      ],
      date,
      '1.0',
    );
    expect(result.status).toBe('READY');
    expect(result.selected).toHaveLength(5);
    expect(
      result.selected.find(({ pointer: value }) => value.artifactKind === 'PARTITION_1'),
    ).toMatchObject({ issue: { number: 2 }, pointer: { attempt: 2 } });
  });

  it('fails closed when the same retry attempt points at different bytes', () => {
    expect(() =>
      resolveHandoffIssues(
        [
          issue(1, 'PARTITION_1'),
          issue(2, 'PARTITION_1', { pointer: { blobSha: 'f'.repeat(40) } }),
        ],
        date,
        '1.0',
      ),
    ).toThrow(expect.objectContaining({ code: 'HANDOFF_DUPLICATE_CONFLICT' }));
  });

  it('closes a processed pointer issue as completed', () => {
    expect(processedIssueUpdate()).toEqual({ state: 'closed', state_reason: 'completed' });
  });

  it('accepts schema 2.0 pointers without task-side hash calculation', () => {
    const parsed = parseHandoffPointer(issue(1, 'PARTITION_1', {}, '2.0').body);
    expect(parsed).not.toHaveProperty('rawSha256');
    expect(parsed).not.toHaveProperty('byteLength');
    expect(() =>
      parseHandoffPointer(
        issue(2, 'PARTITION_1', { pointer: { rawSha256: 'a'.repeat(64) } }, '2.0').body,
      ),
    ).toThrow(expect.objectContaining({ code: 'HANDOFF_POINTER_FIELD_FORBIDDEN' }));
  });

  it('marks a schema 2.0 discovery handoff ready with three partitions only', () => {
    const result = resolveHandoffIssues(
      [
        issue(1, 'PARTITION_1', {}, '2.0'),
        issue(2, 'PARTITION_2', {}, '2.0'),
        issue(3, 'PARTITION_3', {}, '2.0'),
      ],
      date,
      '2.0',
    );
    expect(result).toMatchObject({ status: 'READY', schemaVersion: '2.0' });
    expect(result.selected).toHaveLength(3);
    expect(result.missingArtifactKinds).toEqual([]);
  });
});
