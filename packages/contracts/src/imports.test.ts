import { describe, expect, it } from 'vitest';
import { jobImportSchema, learningImportSchema, problemImportSchema } from './index.js';

describe('import contracts', () => {
  it('rejects malformed job import envelopes before the policy layer', () => {
    const parsed = jobImportSchema.safeParse({ version: '1.0', sourceCount: 0, items: [] });
    expect(parsed.success).toBe(false);
  });

  it('requires learning source evidence anchors and checksums', () => {
    const parsed = learningImportSchema.safeParse({
      version: '1.0',
      source: { title: '자료', subject: 'CS', category: 'demo', sourceVersion: '1', checksum: 'x' },
      units: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('only accepts Programmers problem URLs', () => {
    const parsed = problemImportSchema.safeParse({
      version: '1.0',
      items: [{ sourceUrl: 'https://example.com/1', title: 'demo', level: 1, tags: [] }],
    });
    expect(parsed.success).toBe(false);
  });
});
