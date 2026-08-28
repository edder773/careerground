import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Sites static security policy fallback', () => {
  it('embeds CSP and referrer policy when the Sites asset cache bypasses Worker headers', () => {
    const html = readFileSync('apps/web/index.html', 'utf8');

    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain("default-src 'self'");
    expect(html).toContain("object-src 'none'");
    expect(html).toContain("script-src 'self'");
    expect(html).toContain("frame-src 'none'");
    expect(html).not.toContain('accounts.google.com');
    expect(html).toContain('name="referrer" content="strict-origin-when-cross-origin"');
  });
});
