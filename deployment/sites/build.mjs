import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
