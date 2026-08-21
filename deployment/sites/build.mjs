import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'esbuild';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/client', { recursive: true });
await cp('apps/web/dist', 'dist/client', { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL('./worker.ts', import.meta.url))],
  outfile: 'dist/server/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  sourcemap: true,
});
const hosting = JSON.parse(await readFile('.openai/hosting.json', 'utf8'));
await mkdir('dist/.openai', { recursive: true });
await writeFile('dist/.openai/hosting.json', `${JSON.stringify(hosting, null, 2)}\n`);
// The live Sites D1 ledger confirms 0000-0024 were already applied before the
// provider migration history was established. Replaying them would recreate
// live tables or reapply catalog data. Keep immutable history in the repository,
// but publish only the forward provider baseline and later daily migrations.
const deployMigrationFloor = 25;
const deployMigrations = (await readdir('drizzle'))
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .filter((file) => Number(file.slice(0, 4)) >= deployMigrationFloor)
  .sort();
if (!deployMigrations.length) throw new Error('No forward Sites migrations were found.');
await mkdir('dist/.openai/drizzle', { recursive: true });
for (const migration of deployMigrations) {
  await cp(`drizzle/${migration}`, `dist/.openai/drizzle/${migration}`);
}
