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

  it('preserves the SQL track and source-slide metadata in structured imports', () => {
    const problems = problemImportSchema.parse({
      version: '1.0',
      items: [
        {
          sourceUrl: 'https://school.programmers.co.kr/learn/courses/30/lessons/59042',
          title: '없어진 기록 찾기',
          level: 3,
          track: 'SQL',
          tags: [],
        },
      ],
    });
    expect(problems.items[0]?.track).toBe('SQL');

    const learning = learningImportSchema.parse({
      version: '1.0',
      source: {
        title: '자료',
        subject: 'CS',
        category: 'demo',
        sourceVersion: '1',
        checksum: 'a'.repeat(64),
      },
      units: [
        {
          anchor: 'slide-one',
          title: '슬라이드 학습',
          summaryMarkdown: '원본 슬라이드로 학습합니다.',
          concepts: ['시각 자료'],
          visuals: [
            {
              src: '/learning/slide-one.jpg',
              alt: '원본 PDF 슬라이드',
              caption: 'PDF 1쪽',
              page: 1,
            },
          ],
          flashcards: [{ front: '핵심?', back: '원본 자료' }],
          questions: [{ type: 'SHORT_ANSWER', prompt: '페이지?', answer: '1' }],
        },
      ],
    });
    expect(learning.units[0]?.visuals[0]?.page).toBe(1);
  });
});
