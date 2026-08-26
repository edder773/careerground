import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectWebBundle } from './check-web-bundle-budgets.mjs';

const roots = [];
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'careerground-bundle-budget-'));
  roots.push(root);
  mkdirSync(join(root, 'assets'));
  writeFileSync(
    join(root, 'index.html'),
    '<script type="module" src="/assets/index.js"></script><link rel="stylesheet" href="/assets/index.css">',
  );
  writeFileSync(join(root, 'assets/index.js'), 'console.log("careerground")');
  writeFileSync(join(root, 'assets/index.css'), 'body{color:#123}');
  writeFileSync(join(root, 'assets/lazy.js'), 'export const lazy=true');
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('web bundle budgets', () => {
  it('measures initial assets separately from lazy route chunks', () => {
    const report = inspectWebBundle(fixture());

    expect(report.failures).toEqual([]);
    expect(report.initialRoute.assets).toEqual(['assets/index.css', 'assets/index.js']);
    expect(report.assetCount).toBe(3);
  });

  it('reports the exact asset and initial route budget failures', () => {
    const report = inspectWebBundle(fixture(), {
      maxJavaScriptGzipBytes: 1,
      maxCssGzipBytes: 1,
      initialRouteGzipBytes: 1,
    });

    expect(report.failures.some((failure) => failure.startsWith('assets/index.js:'))).toBe(true);
    expect(report.failures.some((failure) => failure.startsWith('assets/index.css:'))).toBe(true);
    expect(report.failures.some((failure) => failure.startsWith('initial route:'))).toBe(true);
  });
});
