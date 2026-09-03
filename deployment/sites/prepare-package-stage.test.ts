import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { preparePackageStage } from './prepare-package-stage.js';
import { PRODUCTION_MIGRATIONS } from './migration-authority.js';

const BUILD_COMMIT = 'a'.repeat(40);

describe('Sites package staging', () => {
  it('keeps the immutable source history out of the production migration archive', async () => {
    const root = mkdtempSync(join(tmpdir(), 'careerground-package-stage-'));
    const project = join(root, 'project');
    const stage = join(root, 'stage');

    try {
      mkdirSync(join(project, 'dist/server'), { recursive: true });
      mkdirSync(join(project, 'dist/.openai/drizzle'), { recursive: true });
      mkdirSync(join(project, '.openai'), { recursive: true });
      mkdirSync(join(project, 'drizzle'), { recursive: true });
      writeFileSync(join(project, 'dist/server/index.js'), 'export default {};\n');
      writeFileSync(
        join(project, 'dist/build-provenance.json'),
        JSON.stringify({ commitSha: BUILD_COMMIT }),
      );
      writeFileSync(join(project, '.openai/hosting.json'), '{"d1":"DB"}\n');
      for (const migration of PRODUCTION_MIGRATIONS) {
        writeFileSync(join(project, 'dist/.openai/drizzle', migration), `SELECT '${migration}';\n`);
      }
      writeFileSync(join(project, 'drizzle/0000_baseline.sql'), 'SELECT 0;\n');
      writeFileSync(join(project, 'drizzle/0025_forward.sql'), 'SELECT 25;\n');

      const result = await preparePackageStage(project, stage, BUILD_COMMIT);

      expect(result.migrations).toEqual(PRODUCTION_MIGRATIONS);
      expect(result.commitSha).toBe(BUILD_COMMIT);
      expect(() => readFileSync(join(stage, 'drizzle/0000_baseline.sql'))).toThrow();
      expect(
        readFileSync(join(stage, 'dist/.openai/drizzle', PRODUCTION_MIGRATIONS[0]), 'utf8'),
      ).toBe(`SELECT '${PRODUCTION_MIGRATIONS[0]}';\n`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects an unlisted forward migration', async () => {
    const root = mkdtempSync(join(tmpdir(), 'careerground-package-unlisted-'));
    const project = join(root, 'project');
    try {
      mkdirSync(join(project, 'dist/server'), { recursive: true });
      mkdirSync(join(project, 'dist/.openai/drizzle'), { recursive: true });
      mkdirSync(join(project, '.openai'), { recursive: true });
      writeFileSync(join(project, 'dist/server/index.js'), 'export default {};\n');
      writeFileSync(
        join(project, 'dist/build-provenance.json'),
        JSON.stringify({ commitSha: BUILD_COMMIT }),
      );
      writeFileSync(join(project, '.openai/hosting.json'), '{"d1":"DB"}\n');
      for (const migration of PRODUCTION_MIGRATIONS) {
        writeFileSync(join(project, 'dist/.openai/drizzle', migration), 'SELECT 1;\n');
      }
      writeFileSync(join(project, 'dist/.openai/drizzle/9999_unapproved.sql'), 'SELECT 9999;\n');

      await expect(preparePackageStage(project, join(root, 'stage'), BUILD_COMMIT)).rejects.toThrow(
        /migration authority mismatch/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a staged artifact that contains a pre-baseline migration', async () => {
    const root = mkdtempSync(join(tmpdir(), 'careerground-package-legacy-'));
    const project = join(root, 'project');

    try {
      mkdirSync(join(project, 'dist/server'), { recursive: true });
      mkdirSync(join(project, 'dist/.openai/drizzle'), { recursive: true });
      mkdirSync(join(project, '.openai'), { recursive: true });
      writeFileSync(join(project, 'dist/server/index.js'), 'export default {};\n');
      writeFileSync(
        join(project, 'dist/build-provenance.json'),
        JSON.stringify({ commitSha: BUILD_COMMIT }),
      );
      writeFileSync(join(project, '.openai/hosting.json'), '{"d1":"DB"}\n');
      writeFileSync(join(project, 'dist/.openai/drizzle/0024_legacy.sql'), 'SELECT 24;\n');

      await expect(preparePackageStage(project, join(root, 'stage'), BUILD_COMMIT)).rejects.toThrow(
        /baseline migrations: 0024_legacy\.sql/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a stale build before packaging', async () => {
    const root = mkdtempSync(join(tmpdir(), 'careerground-package-stale-'));
    const project = join(root, 'project');

    try {
      mkdirSync(join(project, 'dist/server'), { recursive: true });
      mkdirSync(join(project, '.openai'), { recursive: true });
      writeFileSync(join(project, 'dist/server/index.js'), 'export default {};\n');
      writeFileSync(
        join(project, 'dist/build-provenance.json'),
        JSON.stringify({ commitSha: 'b'.repeat(40) }),
      );
      writeFileSync(join(project, '.openai/hosting.json'), '{"d1":"DB"}\n');

      await expect(preparePackageStage(project, join(root, 'stage'), BUILD_COMMIT)).rejects.toThrow(
        /build provenance is stale/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
