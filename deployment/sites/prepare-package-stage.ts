import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationPattern = /^(\d{4})_.+\.sql$/;
const productionMigrationFloor = 25;

async function directoryIsEmpty(path: string) {
  try {
    return (await readdir(path)).length === 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
    throw error;
  }
}

export async function preparePackageStage(projectRoot: string, stageRoot: string) {
  const project = resolve(projectRoot);
  const stage = resolve(stageRoot);

  if (project === stage) throw new Error('Package stage must be outside the project root.');
  if (!(await directoryIsEmpty(stage))) throw new Error(`Package stage is not empty: ${stage}`);

  await stat(`${project}/dist/server/index.js`);
  await stat(`${project}/.openai/hosting.json`);
  await mkdir(`${stage}/.openai`, { recursive: true });
  await cp(`${project}/dist`, `${stage}/dist`, { recursive: true });
  await cp(`${project}/.openai/hosting.json`, `${stage}/.openai/hosting.json`);

  const migrations = (await readdir(`${stage}/dist/.openai/drizzle`))
    .map((file) => ({ file, match: file.match(migrationPattern) }))
    .filter((entry) => entry.match)
    .map((entry) => ({ file: entry.file, sequence: Number(entry.match?.[1]) }))
    .sort((left, right) => left.sequence - right.sequence);

  if (!migrations.length) throw new Error('Package stage has no forward migrations.');
  const legacy = migrations.filter(({ sequence }) => sequence < productionMigrationFloor);
  if (legacy.length) {
    throw new Error(
      `Package stage contains baseline migrations: ${legacy.map(({ file }) => file).join(', ')}`,
    );
  }

  // Intentionally do not copy the repository-root drizzle directory. The official
  // Sites packager overlays that directory on dist/.openai/drizzle; on this
  // runtime-bootstrapped project that would replay 0000-0015 against production.
  return { stage, migrations: migrations.map(({ file }) => file) };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const stageRoot = process.argv[2];
  if (!stageRoot) throw new Error('Usage: pnpm sites:stage <empty-stage-directory>');
  const result = await preparePackageStage(process.cwd(), stageRoot);
  console.log(JSON.stringify(result));
}
