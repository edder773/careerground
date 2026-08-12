import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { EvidenceManifest } from './types.js';
import { scanSensitive } from './redact.js';

const valueOf = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const pr = valueOf('--pr');
if (!pr) throw new Error('사용법: pnpm evidence:collect --pr <number> [--base <sha>]');
const run = (...args: string[]) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};
const base = valueOf('--base', process.env.GITHUB_BASE_SHA || 'origin/main')!;
const headSha = run('rev-parse', 'HEAD') || null;
const baseSha = run('rev-parse', base) || null;
const diff =
  baseSha && headSha ? run('diff', '--numstat', baseSha, headSha) : run('diff', '--numstat');
const changedFiles = diff
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [added, deleted, path] = line.split('\t');
    return { path: path || '', added: Number(added) || 0, deleted: Number(deleted) || 0 };
  });

async function filesUnder(root: string) {
  const output: string[] = [];
  try {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      const path = join(root, entry.name);
      if (entry.isDirectory()) output.push(...(await filesUnder(path)));
      else output.push(path);
    }
  } catch {
    return output;
  }
  return output;
}
const bundle = (
  await Promise.all(
    (await filesUnder('apps'))
      .filter((path) => path.includes('/dist/'))
      .map(async (path) => ({ path, bytes: (await stat(path)).size })),
  )
)
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 100);
const screenshotFiles = (await filesUnder(`docs/assets/troubleshooting/${pr}`)).filter((path) =>
  /\.(png|jpe?g|webp)$/i.test(path),
);
const screenshots = screenshotFiles.map((path) => ({
  path,
  viewport: path.includes('mobile') ? '375x812' : '1440x900',
  phase: (path.includes('before') ? 'before' : path.includes('diff') ? 'diff' : 'after') as
    'before' | 'after' | 'diff',
}));
const tracked = (run('ls-files') || '')
  .split('\n')
  .filter((path) => path && !/pnpm-lock|\.png|\.webp|migration\.sql/.test(path));
const findings: string[] = [];
for (const path of tracked) {
  try {
    const text = await readFile(path, 'utf8');
    for (const value of scanSensitive(text))
      if (
        !/@careerground\.local|example\.com|REDACTED|replace-with|development-.*secret/.test(value)
      )
        findings.push(`${path}: ${value.slice(0, 40)}`);
  } catch {
    /* binary */
  }
}
const validationRoot = 'work/validation';
const checks: EvidenceManifest['checks'] = [];
for (const name of ['lint', 'typecheck', 'test', 'e2e', 'build']) {
  try {
    const text = await readFile(join(validationRoot, `${name}.txt`), 'utf8');
    checks.push({
      name,
      status: /exit code: 0|passed/i.test(text)
        ? 'passed'
        : /exit code: [1-9]|failed/i.test(text)
          ? 'failed'
          : 'not-run',
      command: `pnpm ${name === 'e2e' ? 'test:e2e' : name}`,
      summary: text.trim().split('\n').slice(-3).join(' '),
    });
  } catch {
    checks.push({
      name,
      status: 'not-run',
      command: `pnpm ${name === 'e2e' ? 'test:e2e' : name}`,
      summary: 'result file not found',
    });
  }
}
const manifest: EvidenceManifest = {
  schemaVersion: '1.0',
  pr,
  collectedAt: new Date().toISOString(),
  repository: { baseSha, headSha, branch: run('branch', '--show-current') || null },
  changedFiles,
  checks,
  bundle,
  screenshots,
  benchmark: { status: 'not-applicable' },
  privacy: { scannedFiles: tracked.length, findings, redacted: true },
  notes: ['운영 데이터와 업로드 원문은 수집 대상에서 제외됩니다.'],
};
const output = `docs/evidence/${pr}/manifest.json`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(output);
