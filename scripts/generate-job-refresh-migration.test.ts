import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  catalogPaths,
  generateReplacementSql,
  validateCatalogs,
} from './generate-job-refresh-migration.mjs';

async function fixtures() {
  const [activeSource, uncertainSource, excludedSource, auditSource] = await Promise.all([
    readFile(catalogPaths.active, 'utf8'),
    readFile(catalogPaths.uncertain, 'utf8'),
    readFile(catalogPaths.excluded, 'utf8'),
    readFile(catalogPaths.audit, 'utf8'),
  ]);
  return { activeSource, uncertainSource, excludedSource, auditSource };
}

describe('job catalog replacement migration', () => {
  it('preserves the three input classifications and replaces every job-linked row', async () => {
    const result = generateReplacementSql(await fixtures());

    expect(result.counts).toEqual({
      active: 51,
      deadlineUnknown: 0,
      needsReview: 0,
      excluded: 19,
      stored: 51,
      visible: 51,
    });
    expect(result.overlapUrls).toHaveLength(0);
    expect(result.sql.match(/INSERT INTO jobs\n/g)).toHaveLength(51);
    expect(result.sql).toContain("DELETE FROM collection_items WHERE item_type = 'JOB_POSTING'");
    expect(result.sql).toContain("DELETE FROM notifications WHERE type = 'JOB_DEADLINE'");
    expect(result.sql).toContain('DELETE FROM saved_jobs;');
    expect(result.sql).toContain('published_at, deadline_at');
    expect(result.sql).toContain('DELETE FROM workspace_search');
    expect(result.sql).toContain('DELETE FROM job_tech_stacks;');
  });

  it('rejects a canonical URL collision before producing destructive SQL', async () => {
    const sources = await fixtures();
    const active = JSON.parse(sources.activeSource);
    active.items[1].sourceUrl = active.items[0].sourceUrl;

    expect(() =>
      validateCatalogs(
        active,
        JSON.parse(sources.uncertainSource),
        JSON.parse(sources.excludedSource),
      ),
    ).toThrow(/canonical sourceUrl/);
  });

  it('keeps the source checksum stable across whitespace and line-ending changes', async () => {
    const sources = await fixtures();
    const original = generateReplacementSql(sources);
    const compact = generateReplacementSql({
      activeSource: JSON.stringify(JSON.parse(sources.activeSource)),
      uncertainSource: JSON.stringify(JSON.parse(sources.uncertainSource)),
      excludedSource: JSON.stringify(JSON.parse(sources.excludedSource)),
      auditSource: JSON.stringify(JSON.parse(sources.auditSource)),
    });

    expect(compact.checksum).toBe(original.checksum);
  });

  it('rejects an excluded overlap unless the retained record is hidden for review', async () => {
    const sources = await fixtures();
    const active = JSON.parse(sources.activeSource);
    const excluded = JSON.parse(sources.excludedSource);
    excluded.items[0].sourceUrl = active.items[0].sourceUrl;

    expect(() => validateCatalogs(active, JSON.parse(sources.uncertainSource), excluded)).toThrow(
      /NEEDS_REVIEW/,
    );
  });

  it('rejects a bundle when the audit counts do not match its records', async () => {
    const sources = await fixtures();
    const audit = JSON.parse(sources.auditSource);
    audit.counts.activeItems -= 1;

    expect(() =>
      generateReplacementSql({ ...sources, auditSource: JSON.stringify(audit) }),
    ).toThrow(/audit active/);
  });
});
