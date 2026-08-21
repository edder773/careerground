import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const rootDirectory = resolve(import.meta.dirname, '../..');
const payloadPath = resolve(rootDirectory, 'data/imports/learning_catalog_20260821.json');
const migrationPath = resolve(rootDirectory, 'drizzle/0029_expand_learning_catalog_20260821.sql');

describe('2026-08-21 learning catalog', () => {
  it('deduplicates the supplied PDFs and provides a complete learning slice', async () => {
    const payload = JSON.parse(await readFile(payloadPath, 'utf8')) as {
      duplicatePolicy: { suppliedFiles: number; uniqueSources: number };
      sources: Array<{
        key: string;
        sourceChecksum: string;
        units: Array<{
          anchor: string;
          summaryMarkdown: string;
          visuals: Array<{ src: string; page: number }>;
          flashcards: unknown[];
          questions: unknown[];
        }>;
      }>;
    };

    expect(payload.duplicatePolicy).toEqual({
      suppliedFiles: 11,
      uniqueSources: 10,
      rule: 'sha256 checksum and source version',
    });
    expect(payload.sources).toHaveLength(10);
    expect(new Set(payload.sources.map((source) => source.sourceChecksum)).size).toBe(10);

    const units = payload.sources.flatMap((source) => source.units);
    expect(units.length).toBeGreaterThanOrEqual(75);
    expect(new Set(units.map((unit) => unit.anchor)).size).toBe(units.length);

    for (const unit of units) {
      expect(unit.summaryMarkdown).toContain('### 핵심 이론');
      expect(unit.summaryMarkdown).toContain('### 실무 적용');
      expect(unit.summaryMarkdown).toContain('### 실수 방지 체크');
      expect(unit.visuals).toHaveLength(1);
      expect(unit.visuals[0]!.page).toBeGreaterThan(0);
      expect(unit.flashcards).toHaveLength(2);
      expect(unit.questions).toHaveLength(1);
      expect(
        (await stat(resolve(rootDirectory, `apps/web/public${unit.visuals[0]!.src}`))).size,
      ).toBeGreaterThan(1_000);
    }
  });

  it('records an idempotent migration matching the generated payload checksum', async () => {
    const payload = JSON.parse(await readFile(payloadPath, 'utf8'));
    const checksum = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(migration).not.toContain('INSERT OR REPLACE INTO learning_units');
    expect(migration).toContain(`sha256:${checksum}`);
    expect(migration).toContain('0029_expand_learning_catalog_20260821');
  });
});
