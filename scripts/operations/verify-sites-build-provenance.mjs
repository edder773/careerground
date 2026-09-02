import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const SHA_PATTERN = /^[a-f0-9]{40}$/u;

export function verifySitesBuildProvenance({ expectedCommit, buildProvenance }) {
  const expected = String(expectedCommit || '').trim();
  const actual = String(buildProvenance?.commitSha || '').trim();
  if (!SHA_PATTERN.test(expected)) throw new Error('Current Git commit SHA is invalid.');
  if (!SHA_PATTERN.test(actual)) throw new Error('Sites build provenance commit SHA is invalid.');
  if (actual !== expected) {
    throw new Error(`Sites build provenance is stale: expected ${expected}, found ${actual}.`);
  }
  return { status: 'pass', expectedCommit: expected, buildCommit: actual };
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const expectedCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  const buildProvenance = JSON.parse(readFileSync(resolve('dist/build-provenance.json'), 'utf8'));
  process.stdout.write(
    `${JSON.stringify(verifySitesBuildProvenance({ expectedCommit, buildProvenance }))}\n`,
  );
}
