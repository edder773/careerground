import { describe, expect, it } from 'vitest';
import { validateTroubleshootingDocument } from './document-validation.js';

const manual = `---
generatedByAI: false
pr: pending
commit: pending
evidence: docs/evidence/example.json
---

# 수동 기록
`;

describe('troubleshooting document validation', () => {
  it('does not require an AI model for a manual evidence record', () => {
    expect(validateTroubleshootingDocument(manual, 'docs/troubleshooting/case.md')).toEqual([]);
  });

  it('requires a model only when AI generation is declared', () => {
    expect(
      validateTroubleshootingDocument(
        manual.replace('generatedByAI: false', 'generatedByAI: true'),
        'docs/troubleshooting/case.md',
      ),
    ).toContain('AI-generated document missing model:');
  });

  it('allows the index to omit case-specific PR evidence fields', () => {
    expect(
      validateTroubleshootingDocument(
        '---\ngeneratedByAI: false\n---\n# 안내',
        'docs/troubleshooting/README.md',
      ),
    ).toEqual([]);
  });
});
