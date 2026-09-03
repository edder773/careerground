import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTION_MIGRATION_FLOOR, PRODUCTION_MIGRATIONS } from './migration-authority.js';

const migrationPattern = /^(\d{4})_.+\.sql$/;
const commitPattern = /^[a-f0-9]{40}$/u;

async function directoryIsEmpty(path: string) {
  try {
    return (await readdir(path)).length === 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
    throw error;
  }
}

export async function preparePackageStage(
  projectRoot: string,
  stageRoot: string,
  expectedCommit = '',
) {
  const project = resolve(projectRoot);
  const stage = resolve(stageRoot);
  const sourceCommit = String(
    expectedCommit ||
      execFileSync('git', ['-C', project, 'rev-parse', 'HEAD'], { encoding: 'utf8' }),
  ).trim();

  if (project === stage) throw new Error('Package stage must be outside the project root.');
  if (!(await directoryIsEmpty(stage))) throw new Error(`Package stage is not empty: ${stage}`);
  if (!commitPattern.test(sourceCommit)) {
    throw new Error(`Invalid source commit for Sites package: ${sourceCommit || 'missing'}`);
  }

  await stat(`${project}/dist/server/index.js`);
  await stat(`${project}/.openai/hosting.json`);
  const provenance = JSON.parse(
    await readFile(`${project}/dist/build-provenance.json`, 'utf8'),
  ) as {
    commitSha?: unknown;
  };
  if (provenance.commitSha !== sourceCommit) {
    throw new Error(
      `Sites package build provenance is stale: expected ${sourceCommit}, found ${String(provenance.commitSha || 'missing')}`,
    );
  }
  await mkdir(`${stage}/.openai`, { recursive: true });
  await cp(`${project}/dist`, `${stage}/dist`, { recursive: true });
  await cp(`${project}/.openai/hosting.json`, `${stage}/.openai/hosting.json`);

  const migrations = (await readdir(`${stage}/dist/.openai/drizzle`))
    .map((file) => ({ file, match: file.match(migrationPattern) }))
    .filter((entry) => entry.match)
    .map((entry) => ({ file: entry.file, sequence: Number(entry.match?.[1]) }))
    .sort((left, right) => left.sequence - right.sequence);

  if (!migrations.length) throw new Error('Package stage has no forward migrations.');
  const legacy = migrations.filter(({ sequence }) => sequence < PRODUCTION_MIGRATION_FLOOR);
  if (legacy.length) {
    throw new Error(
      `Package stage contains baseline migrations: ${legacy.map(({ file }) => file).join(', ')}`,
    );
  }
  const migrationNames = migrations.map(({ file }) => file).sort();
  const authorityNames = [...PRODUCTION_MIGRATIONS].sort();
  if (JSON.stringify(migrationNames) !== JSON.stringify(authorityNames)) {
    throw new Error(
      `Package stage migration authority mismatch: expected=${authorityNames.join(',')} actual=${migrationNames.join(',')}`,
    );
  }

  // Intentionally do not copy the repository-root drizzle directory. The official
  // Sites packager overlays that directory on dist/.openai/drizzle; on this
  // runtime-bootstrapped project that would replay 0000-0015 against production.
  return { stage, migrations: [...PRODUCTION_MIGRATIONS], commitSha: sourceCommit };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const stageRoot = process.argv[2];
  if (!stageRoot) throw new Error('Usage: pnpm sites:stage <empty-stage-directory>');
  const result = await preparePackageStage(process.cwd(), stageRoot);
  console.log(JSON.stringify(result));
}
