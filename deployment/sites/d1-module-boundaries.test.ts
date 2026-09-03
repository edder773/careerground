import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readSource = (name: string) => readFile(new URL(name, import.meta.url), 'utf8');

describe('D1 API module boundaries', () => {
  it('keeps the route orchestrator below the structural size budget', async () => {
    const source = await readSource('./d1-api.ts');

    expect(Buffer.byteLength(source)).toBeLessThan(20_000);
    expect(source.split('\n').length).toBeLessThan(400);
  });

  it('delegates public catalogs, daily challenges and protected operations to domain modules', async () => {
    const source = await readSource('./d1-api.ts');

    expect(source).toContain("from './d1-public-catalog.js'");
    expect(source).toContain("from './d1-daily-challenges.js'");
    expect(source).toContain("from './d1-jobs-v5.js'");
    expect(source).toContain("from './d1-api-utils.js'");
    expect(source).not.toMatch(
      /\/auth\/|\/learning\/|\/collections\/|\/solutions\/|\/notifications\//,
    );
  });

  it('keeps extracted modules independent from the route orchestrator', async () => {
    const modules = await Promise.all(
      [
        './d1-api-contract.ts',
        './d1-api-utils.ts',
        './d1-daily-challenges.ts',
        './d1-public-catalog.ts',
        './security-token.ts',
      ].map(readSource),
    );

    for (const source of modules) expect(source).not.toContain("from './d1-api.js'");
  });

  it('does not retain legacy API implementation modules', async () => {
    await Promise.all(
      ['./d1-auth.ts', './d1-imports.ts', './google-auth.ts'].map(async (name) => {
        await expect(access(new URL(name, import.meta.url))).rejects.toThrow();
      }),
    );
  });

  it('keeps the production Worker independent from alternate backend runtimes', async () => {
    const [worker, hosting] = await Promise.all([
      readSource('./worker.ts'),
      readFile(new URL('../../.openai/hosting.json', import.meta.url), 'utf8'),
    ]);
    const productionBoundary = `${worker}\n${hosting}`;

    expect(productionBoundary).not.toMatch(/@nestjs|@prisma|apps\/api|API_ORIGIN/);
    expect(worker).toContain("from './d1-api.js'");
  });

  it('keeps the workspace free of the retired Nest, Prisma and Docker backend', async () => {
    const root = new URL('../../', import.meta.url);
    const [rootPackage, workspace, ci, lockfile] = await Promise.all([
      readFile(new URL('package.json', root), 'utf8'),
      readFile(new URL('pnpm-workspace.yaml', root), 'utf8'),
      readFile(new URL('.github/workflows/ci.yml', root), 'utf8'),
      readFile(new URL('pnpm-lock.yaml', root), 'utf8'),
    ]);

    await expect(access(new URL('apps/api', root))).rejects.toThrow();
    await expect(access(new URL('docker-compose.yml', root))).rejects.toThrow();
    await expect(access(new URL('apps/web/Dockerfile', root))).rejects.toThrow();
    await expect(access(new URL('apps/web/src/generated/openapi.ts', root))).rejects.toThrow();

    expect(rootPackage).not.toMatch(
      /@careerground\/api|openapi-typescript|db:(generate|migrate|deploy|seed|reset)/,
    );
    expect(workspace).not.toMatch(/@prisma|\bprisma:\s|deepmerge-ts/);
    expect(ci).not.toContain('pnpm db:generate');
    expect(lockfile).not.toMatch(/^\s{2}apps\/api:/m);
    expect(lockfile).not.toMatch(/^\s{2}['"]?@nestjs\//m);
    expect(lockfile).not.toMatch(/^\s{2}['"]?@prisma\//m);
    expect(lockfile).not.toMatch(/^\s{2}prisma@/m);
  });
});
