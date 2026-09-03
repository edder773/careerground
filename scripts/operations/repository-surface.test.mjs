import { access, readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const fromRoot = (path) => new URL(path, root);

describe('repository operational surface', () => {
  it('keeps only the production schema 2.0 jobs handoff entry points', async () => {
    const [rootPackage, handoffWorkflow] = await Promise.all([
      readFile(fromRoot('package.json'), 'utf8'),
      readFile(fromRoot('.github/workflows/careerground-v5-handoff.yml'), 'utf8'),
    ]);
    const retiredPaths = [
      '.github/workflows/careerground-jobs-v5.yml',
      'scripts/jobs-v5/cli.mjs',
      'scripts/jobs-v5/legacy-v4-adapter.mjs',
      'scripts/generate-job-refresh-migration.mjs',
      'scripts/generate-job-reconciliation-migration.mjs',
      'scripts/generate-library-job-insert-migration.mjs',
      'scripts/generate-validator-job-sync-migration.mjs',
    ];

    await Promise.all(
      retiredPaths.map(async (path) => {
        await expect(access(fromRoot(path))).rejects.toThrow();
      }),
    );
    expect(rootPackage).not.toMatch(
      /jobs:(?:catalog:|library:|validator:|v5:(?:adapt-v4|preflight|collect|merge|run|dry-run))/u,
    );
    expect(handoffWorkflow).not.toMatch(/adapt-v4|legacy-compatible|LEGACY_(?:FINAL|AUDIT)/u);
  });

  it('runs pull-request validation once in one CI workflow', async () => {
    const ci = await readFile(fromRoot('.github/workflows/ci.yml'), 'utf8');

    await expect(access(fromRoot('.github/workflows/e2e.yml'))).rejects.toThrow();
    await expect(
      access(fromRoot('.github/workflows/troubleshooting-evidence.yml')),
    ).rejects.toThrow();
    expect(ci.match(/pnpm install --frozen-lockfile/gu)).toHaveLength(1);
    expect(ci.match(/^\s+- run: pnpm build$/gmu)).toHaveLength(1);
    expect(ci.match(/^\s+run: pnpm test:e2e$/gmu)).toHaveLength(1);
    expect(ci).toContain('pnpm test:e2e --project=chromium --project=chromium-mobile-375');
    expect(ci).not.toContain('pnpm test:e2e -- --project=');
    expect(ci).toContain("if: github.event_name == 'pull_request'");
    expect(ci).toContain("if: github.event_name == 'push'");
    expect(ci).toContain('playwright install --with-deps chromium');
    expect(ci).toContain('playwright install --with-deps chromium firefox webkit');
    expect(ci).not.toMatch(/^\s+- run: pnpm sites:build$/gmu);
  });

  it('generates troubleshooting documents only for an explicitly labelled merge', async () => {
    const workflow = await readFile(
      fromRoot('.github/workflows/troubleshooting-ai-docs.yml'),
      'utf8',
    );

    expect(workflow).toContain(
      "contains(github.event.pull_request.labels.*.name, 'troubleshooting-doc')",
    );
    expect(workflow).not.toMatch(/PR_TITLE|fix\|perf\|refactor\|feat/u);
  });
});
