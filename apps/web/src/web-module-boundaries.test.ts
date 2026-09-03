import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(import.meta.dirname);
const readSource = (path: string) => readFileSync(resolve(sourceRoot, path), 'utf8');
const lineCount = (source: string) => source.split(/\r?\n/u).length - 1;

describe('web module boundaries', () => {
  it('keeps the jobs route focused on orchestration', () => {
    const page = readSource('pages/JobsPage.tsx');

    expect(lineCount(page)).toBeLessThanOrEqual(900);
    expect(page).toContain("from '../features/jobs/JobControls'");
    expect(page).toContain("from '../features/jobs/job-domain'");
    expect(page).not.toMatch(/function (JobDetailModal|JobFilterPanel|ScheduleListDialog)/);
  });

  it('keeps the global stylesheet as an ordered module manifest', () => {
    const manifest = readSource('styles.css').trim().split(/\r?\n/u);
    const expected = [
      "@import './styles/foundation.css';",
      "@import './styles/workspace.css';",
      "@import './styles/workflows.css';",
      "@import './styles/jobs.css';",
      "@import './styles/final-overrides.css';",
    ];

    expect(manifest).toEqual(expected);
    for (const statement of manifest) {
      const path = statement.match(/'(.+)'/)?.[1];
      expect(path).toBeTruthy();
      expect(lineCount(readSource(path!))).toBeLessThanOrEqual(3500);
    }
  });
});
