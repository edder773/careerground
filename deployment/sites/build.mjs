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
// The existing Sites D1 was bootstrapped by the additive runtime schema before
// provider-managed migrations were available. Replaying 0000-0015 would try to
// create those live tables again. Keep the complete immutable history in the
// repository, but publish only forward migrations after that production baseline.
const deployMigrationFloor = 17;
const deployMigrations = (await readdir('drizzle'))
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .filter((file) => Number(file.slice(0, 4)) >= deployMigrationFloor)
  .sort();
if (!deployMigrations.length) throw new Error('No forward Sites migrations were found.');
await mkdir('dist/.openai/drizzle', { recursive: true });
for (const migration of deployMigrations) {
  await cp(`drizzle/${migration}`, `dist/.openai/drizzle/${migration}`);
}
