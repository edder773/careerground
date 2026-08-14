import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { preparePackageStage } from './prepare-package-stage.js';

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
      writeFileSync(join(project, '.openai/hosting.json'), '{"d1":"DB"}\n');
      writeFileSync(join(project, 'dist/.openai/drizzle/0016_forward.sql'), 'SELECT 16;\n');
      writeFileSync(join(project, 'drizzle/0000_baseline.sql'), 'SELECT 0;\n');
      writeFileSync(join(project, 'drizzle/0016_forward.sql'), 'SELECT 16;\n');

      const result = await preparePackageStage(project, stage);

      expect(result.migrations).toEqual(['0016_forward.sql']);
      expect(() => readFileSync(join(stage, 'drizzle/0000_baseline.sql'))).toThrow();
      expect(readFileSync(join(stage, 'dist/.openai/drizzle/0016_forward.sql'), 'utf8')).toBe(
        'SELECT 16;\n',
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
      writeFileSync(join(project, '.openai/hosting.json'), '{"d1":"DB"}\n');
      writeFileSync(join(project, 'dist/.openai/drizzle/0015_legacy.sql'), 'SELECT 15;\n');

      await expect(preparePackageStage(project, join(root, 'stage'))).rejects.toThrow(
        /baseline migrations: 0015_legacy\.sql/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
