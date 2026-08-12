import { describe, expect, it, vi } from 'vitest';
import { MockTroubleshootingProvider, OpenAIResponsesProvider } from './provider.js';
import { redact } from './redact.js';
import type { EvidenceManifest } from './types.js';

const manifest: EvidenceManifest = {
  schemaVersion: '1.0',
  pr: '12',
  collectedAt: '2026-08-12T00:00:00Z',
  repository: { baseSha: 'a', headSha: 'b', branch: 'feat' },
  changedFiles: [{ path: 'a.ts', added: 2, deleted: 1 }],
  checks: [{ name: 'test', status: 'passed', command: 'pnpm test', summary: '7 passed' }],
  bundle: [],
  screenshots: [],
  benchmark: { status: 'not-applicable' },
  privacy: { scannedFiles: 1, findings: [], redacted: true },
  notes: [],
};
describe('troubleshooting providers', () => {
  it('generates deterministic evidence-only docs without network', async () => {
    const output = await new MockTroubleshootingProvider().generate(manifest, { publicBlog: true });
    expect(output.technicalMarkdown).toContain('a.ts');
    expect(output.technicalMarkdown).toContain('정량 측정 불가');
  });
  it('redacts emails, tokens and internal URLs', () => {
    expect(redact('a@company.com sk-abcdefghijklmnop http://localhost:4000/private')).not.toContain(
      'a@company.com',
    );
  });
  it('requires explicit OpenAI credentials', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('OPENAI_TROUBLESHOOTING_MODEL', '');
    await expect(
      new OpenAIResponsesProvider().generate(manifest, { publicBlog: true }),
    ).rejects.toThrow('OPENAI_API_KEY');
  });
});
