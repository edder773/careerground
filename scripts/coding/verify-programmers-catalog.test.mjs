import { describe, expect, it } from 'vitest';
import { parseProgrammersMetadata } from './verify-programmers-catalog.mjs';
import catalog from '../../shared/verified-programmers-catalog.json' with { type: 'json' };

describe('official classification evidence', () => {
  it.each([
    ['database', 'SQL'],
    ['algorithm', 'ALGORITHM'],
  ])('parses %s publisher metadata', (type, track) => {
    expect(
      parseProgrammersMetadata(
        `<div data-challenge-category="${type}" data-challengeable-type="${type}" data-challenge-level="1">`,
      ),
    ).toEqual({ track, level: 1 });
  });
  it.each([
    '<h1>SQL 출력하기</h1>',
    '<div data-challenge-category="database" data-challengeable-type="algorithm" data-challenge-level="1">',
    '<div data-challenge-category="database" data-challengeable-type="database">',
  ])('rejects absent or conflicting source metadata', (html) => {
    expect(() => parseProgrammersMetadata(html)).toThrow('metadata');
  });
  it('keeps a complete unique typed verification catalog', () => {
    expect(catalog.problems).toHaveLength(427);
    expect(new Set(catalog.problems.map((row) => row.lessonId)).size).toBe(427);
    expect(catalog.problems.filter((row) => row.track === 'SQL')).toHaveLength(67);
    expect(catalog.problems.filter((row) => row.track === 'ALGORITHM')).toHaveLength(360);
    expect(
      catalog.problems.every(
        (row) => Number.isInteger(row.level) && row.level >= 0 && row.level <= 5,
      ),
    ).toBe(true);
    expect(catalog.problems.find((row) => row.lessonId === 132203)).toMatchObject({
      track: 'SQL',
      level: 1,
    });
  });
});
