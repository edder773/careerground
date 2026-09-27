import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  HANDOFF_LABEL,
  assertHandoffBundleIdentity,
  assertTrustedHandoffIssue,
  parseHandoffPointer,
  processedIssueUpdate,
  resolveHandoffIssues,
} from './handoff.mjs';

const date = '2026-08-28';

function pointer(artifactKind, overrides = {}, schemaVersion = '2.0') {
  const fileName = `careerground-partition-${artifactKind.at(-1)}-${date}.json`;
  return {
    schemaVersion,
    workflowId: 'CG-JOBS-PROD-V5',
    targetAsOfDate: date,
    artifactKind,
    attempt: 1,
    blobSha: createHash('sha1').update(artifactKind).digest('hex'),
    fileName,
    ...overrides,
  };
}

function issue(number, artifactKind, overrides = {}, schemaVersion = '2.0') {
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

  it('waits until all three partitions are present', () => {
    const result = resolveHandoffIssues([issue(1, 'PARTITION_1'), issue(2, 'PARTITION_2')], date);
    expect(result.status).toBe('WAITING');
    expect(result.missingArtifactKinds).toEqual(['PARTITION_3']);
  });

  it('waits for all partitions of the highest retry attempt', () => {
    const result = resolveHandoffIssues(
      [
        issue(1, 'PARTITION_1'),
        issue(2, 'PARTITION_1', { pointer: { attempt: 2 } }),
        issue(3, 'PARTITION_2'),
        issue(4, 'PARTITION_3'),
      ],
      date,
    );
    expect(result.status).toBe('WAITING');
    expect(result.selected).toHaveLength(1);
    expect(
      result.selected.find(({ pointer: value }) => value.artifactKind === 'PARTITION_1'),
    ).toMatchObject({ issue: { number: 2 }, pointer: { attempt: 2 } });
    expect(result.missingArtifactKinds).toEqual(['PARTITION_2', 'PARTITION_3']);
    expect(result.supersededIssueNumbers).toEqual([1]);
  });

  it('accepts one complete reviewed bundle and rejects a mixed bundle identifier', () => {
    const first = 'a'.repeat(64);
    const second = 'b'.repeat(64);
    const entries = [1, 2, 3].map((n) =>
      issue(n, `PARTITION_${n}`, { pointer: { attempt: 2, bundleId: first } }),
    );
    expect(resolveHandoffIssues(entries, date)).toMatchObject({
      status: 'READY',
      attempt: 2,
      bundleId: first,
    });
    entries[2] = issue(3, 'PARTITION_3', { pointer: { attempt: 2, bundleId: second } });
    expect(() => resolveHandoffIssues(entries, date)).toThrow(
      expect.objectContaining({ code: 'HANDOFF_BUNDLE_ID_CONFLICT' }),
    );
  });

  it('rejects a blob whose embedded bundle differs from its pointer', () => {
    const frozen = 'a'.repeat(64);
    const parsed = pointer('PARTITION_1', { bundleId: frozen });
    expect(() => assertHandoffBundleIdentity(parsed, { bundleId: 'b'.repeat(64) })).toThrow(
      expect.objectContaining({ code: 'HANDOFF_BUNDLE_ID_MISMATCH' }),
    );
    expect(() => assertHandoffBundleIdentity(parsed, { bundleId: frozen })).not.toThrow();
  });

  it('fails closed when the same retry attempt points at different bytes', () => {
    expect(() =>
      resolveHandoffIssues(
        [
          issue(1, 'PARTITION_1'),
          issue(2, 'PARTITION_1', { pointer: { blobSha: 'f'.repeat(40) } }),
        ],
        date,
      ),
    ).toThrow(expect.objectContaining({ code: 'HANDOFF_DUPLICATE_CONFLICT' }));
  });

  it('closes a processed pointer issue as completed', () => {
    expect(processedIssueUpdate()).toEqual({ state: 'closed', state_reason: 'completed' });
  });

  it('accepts schema 2.0 pointers without task-side hash calculation', () => {
    const parsed = parseHandoffPointer(issue(1, 'PARTITION_1').body);
    expect(parsed).not.toHaveProperty('rawSha256');
    expect(parsed).not.toHaveProperty('byteLength');
    expect(() =>
      parseHandoffPointer(issue(2, 'PARTITION_1', { pointer: { rawSha256: 'a'.repeat(64) } }).body),
    ).toThrow(expect.objectContaining({ code: 'HANDOFF_POINTER_FIELD_FORBIDDEN' }));
  });

  it('rejects the retired schema 1.0 and its extra artifacts', () => {
    expect(() => parseHandoffPointer(issue(1, 'PARTITION_1', {}, '1.0').body)).toThrow(
      expect.objectContaining({ code: 'HANDOFF_IDENTITY_INVALID' }),
    );
    expect(() => parseHandoffPointer(issue(2, 'LEGACY_FINAL').body)).toThrow(
      expect.objectContaining({ code: 'HANDOFF_KIND_INVALID' }),
    );
  });

  it('marks a discovery handoff ready with three partitions only', () => {
    const result = resolveHandoffIssues(
      [issue(1, 'PARTITION_1'), issue(2, 'PARTITION_2'), issue(3, 'PARTITION_3')],
      date,
    );
    expect(result).toMatchObject({ status: 'READY', schemaVersion: '2.0' });
    expect(result.selected).toHaveLength(3);
    expect(result.missingArtifactKinds).toEqual([]);
    expect(result.supersededIssueNumbers).toEqual([]);
  });

  it('marks duplicate and older retry pointers as superseded after a complete bundle', () => {
    const result = resolveHandoffIssues(
      [
        issue(10, 'PARTITION_1'),
        issue(11, 'PARTITION_1', { pointer: { attempt: 2 } }),
        issue(12, 'PARTITION_2'),
        issue(13, 'PARTITION_3'),
      ],
      date,
    );

    expect(result.status).toBe('WAITING');
    expect(result.selected.map(({ issue: value }) => value.number)).toEqual([11]);
    expect(result.missingArtifactKinds).toEqual(['PARTITION_2', 'PARTITION_3']);
    expect(result.supersededIssueNumbers).toEqual([10]);
  });
});
