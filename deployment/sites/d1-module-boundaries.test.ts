import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readSource = (name: string) => readFile(new URL(name, import.meta.url), 'utf8');

describe('D1 API module boundaries', () => {
  it('keeps the route orchestrator below the structural size budget', async () => {
    const source = await readSource('./d1-api.ts');

    expect(Buffer.byteLength(source)).toBeLessThan(130_000);
    expect(source.split('\n').length).toBeLessThan(3_500);
  });

  it('delegates auth, daily challenge, Slack and import policies to domain modules', async () => {
    const source = await readSource('./d1-api.ts');

    expect(source).toContain("from './d1-auth.js'");
    expect(source).toContain("from './d1-daily-challenges.js'");
    expect(source).toContain("from './d1-imports.js'");
    expect(source).toContain("from './d1-api-utils.js'");
    expect(source).not.toContain('DIGEST_AUTH_NOT_CONFIGURED');
    expect(source).not.toContain('IMPORT_REVIEW_ACK_REQUIRED');
    expect(source).not.toContain('GOOGLE_IDENTITY_CONFLICT');
  });

  it('keeps extracted modules independent from the route orchestrator', async () => {
    const modules = await Promise.all(
      [
        './d1-api-contract.ts',
        './d1-api-utils.ts',
        './d1-auth.ts',
        './d1-daily-challenges.ts',
        './d1-imports.ts',
      ].map(readSource),
    );

    for (const source of modules) expect(source).not.toContain("from './d1-api.js'");
  });

  it('keeps the production Worker independent from the Nest and Prisma reference app', async () => {
    const [worker, hosting] = await Promise.all([
      readSource('./worker.ts'),
      readFile(new URL('../../.openai/hosting.json', import.meta.url), 'utf8'),
    ]);
    const productionBoundary = `${worker}\n${hosting}`;

    expect(productionBoundary).not.toMatch(/@nestjs|@prisma|apps\/api|API_ORIGIN/);
    expect(worker).toContain("from './d1-api.js'");
  });
});
