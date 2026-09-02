import { describe, expect, it } from 'vitest';
import { verifySitesBuildProvenance } from './verify-sites-build-provenance.mjs';

describe('Sites build provenance verifier', () => {
  const current = 'a'.repeat(40);

  it('accepts an artifact built from the current commit', () => {
    expect(
      verifySitesBuildProvenance({
        expectedCommit: current,
        buildProvenance: { commitSha: current },
      }),
    ).toEqual({ status: 'pass', expectedCommit: current, buildCommit: current });
  });

  it('blocks a stale artifact before it is packaged or deployed', () => {
    expect(() =>
      verifySitesBuildProvenance({
        expectedCommit: current,
        buildProvenance: { commitSha: 'b'.repeat(40) },
      }),
    ).toThrow(/provenance is stale/);
  });

  it('rejects missing or malformed commit metadata', () => {
    expect(() =>
      verifySitesBuildProvenance({
        expectedCommit: 'main',
        buildProvenance: { commitSha: current },
      }),
    ).toThrow(/current Git commit SHA is invalid/i);
    expect(() =>
      verifySitesBuildProvenance({ expectedCommit: current, buildProvenance: {} }),
    ).toThrow(/build provenance commit SHA is invalid/i);
  });
});
