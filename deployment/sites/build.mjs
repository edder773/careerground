import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'esbuild';
import {
  EXPECTED_SCHEMA_CHECKSUM,
  EXPECTED_SCHEMA_VERSION,
  PRODUCTION_MIGRATION_FLOOR,
  PRODUCTION_MIGRATIONS,
} from './migration-authority.ts';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/client', { recursive: true });
await cp('apps/web/dist', 'dist/client', { recursive: true });
const buildCommitSha = String(
  process.env.CAREERGROUND_BUILD_COMMIT_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }),
).trim();
if (!/^[a-f0-9]{40}$/u.test(buildCommitSha)) {
  throw new Error(`Invalid CareerGround build commit SHA: ${buildCommitSha}`);
}
await build({
  entryPoints: [fileURLToPath(new URL('./worker.ts', import.meta.url))],
  outfile: 'dist/server/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  sourcemap: true,
  define: {
    __CAREERGROUND_BUILD_COMMIT__: JSON.stringify(buildCommitSha),
  },
});
await writeFile(
  'dist/build-provenance.json',
  `${JSON.stringify({ commitSha: buildCommitSha, featureVersion: 'lean-public-surface-v1' }, null, 2)}\n`,
);
const hosting = JSON.parse(await readFile('.openai/hosting.json', 'utf8'));
await mkdir('dist/.openai', { recursive: true });
await writeFile('dist/.openai/hosting.json', `${JSON.stringify(hosting, null, 2)}\n`);
// The live Sites D1 ledger confirms 0000-0024 were already applied before the
// provider migration history was established. Replaying them would recreate
// live tables or reapply catalog data. Keep immutable history in the repository,
// but publish only the forward provider baseline and later daily migrations.
const availableMigrations = (await readdir('drizzle'))
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .filter((file) => Number(file.slice(0, 4)) >= PRODUCTION_MIGRATION_FLOOR)
  .sort();
if (JSON.stringify(availableMigrations) !== JSON.stringify([...PRODUCTION_MIGRATIONS].sort())) {
  throw new Error(
    `Forward migration authority mismatch: expected=${PRODUCTION_MIGRATIONS.join(',')} actual=${availableMigrations.join(',')}`,
  );
}
const latestMigration = await readFile(`drizzle/${PRODUCTION_MIGRATIONS.at(-1)}`, 'utf8');
if (
  !latestMigration.includes(`'${EXPECTED_SCHEMA_VERSION}'`) ||
  !latestMigration.includes(`'${EXPECTED_SCHEMA_CHECKSUM}'`)
) {
  throw new Error('Latest migration does not record the authoritative version and checksum.');
}
await mkdir('dist/.openai/drizzle', { recursive: true });
for (const migration of PRODUCTION_MIGRATIONS) {
  await cp(`drizzle/${migration}`, `dist/.openai/drizzle/${migration}`);
}
